using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Security.Cryptography;
using System.Threading;
using System.Diagnostics;

// Minimal helper for SLK20R. Confirma carga de DLLs del SDK y expone comandos --check y --enroll.
// IMPORTANTE: Este helper está compilado como x86 para poder cargar DLLs de 32 bits del SDK.
// Ruta esperada de DLLs: ./lib/zkfinger10.dll o ./lib/zkfinger10-32.dll (copiadas por el csproj)

class Program
{
    // P/Invoke a kernel32 para verificar carga de DLLs nativas
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern IntPtr LoadLibrary(string lpFileName);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool FreeLibrary(IntPtr hModule);

    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern bool SetDllDirectory(string lpPathName);

    // P/Invoke del controlador del lector (libzkfp.dll)
    [DllImport("libzkfp.dll", CallingConvention = CallingConvention.StdCall)]
    private static extern int ZKFPM_Init();

    [DllImport("libzkfp.dll", CallingConvention = CallingConvention.StdCall)]
    private static extern int ZKFPM_Terminate();

    [DllImport("libzkfp.dll", CallingConvention = CallingConvention.StdCall)]
    private static extern int ZKFPM_GetDeviceCount();

    [DllImport("libzkfp.dll", CallingConvention = CallingConvention.StdCall)]
    private static extern IntPtr ZKFPM_OpenDevice(int index);

    [DllImport("libzkfp.dll", CallingConvention = CallingConvention.StdCall)]
    private static extern int ZKFPM_CloseDevice(IntPtr hDevice);

    [DllImport("libzkfp.dll", CallingConvention = CallingConvention.StdCall)]
    private static extern int ZKFPM_GetCaptureParamsEx(IntPtr hDevice, ref int width, ref int height, ref int dpi);

    [DllImport("libzkfp.dll", CallingConvention = CallingConvention.StdCall)]
    private static extern int ZKFPM_AcquireFingerprint(IntPtr hDevice, byte[] fpImage, uint cbFPImage, byte[] fpTemplate, ref uint cbTemplate);

    [DllImport("libzkfp.dll", CallingConvention = CallingConvention.StdCall)]
    private static extern int ZKFPM_AcquireFingerprintImage(IntPtr hDevice, byte[] fpImage, uint cbFPImage);

    [DllImport("libzkfp.dll", CallingConvention = CallingConvention.StdCall)]
    private static extern IntPtr ZKFPM_DBInit();

    [DllImport("libzkfp.dll", CallingConvention = CallingConvention.StdCall)]
    private static extern int ZKFPM_DBFree(IntPtr hDBCache);

    [DllImport("libzkfp.dll", CallingConvention = CallingConvention.StdCall, CharSet = CharSet.Ansi)]
    private static extern int ZKFPM_ExtractFromImage(IntPtr hDBCache, string lpFilePathName, uint DPI, byte[] fpTemplate, ref uint cbTemplate);

    // Add DB operations for identification
    [DllImport("libzkfp.dll", CallingConvention = CallingConvention.StdCall)]
    private static extern int ZKFPM_DBAdd(IntPtr hDBCache, int fid, byte[] fpTemplate, int cbTemplate);

    [DllImport("libzkfp.dll", CallingConvention = CallingConvention.StdCall)]
    private static extern int ZKFPM_DBClear(IntPtr hDBCache);

    [DllImport("libzkfp.dll", CallingConvention = CallingConvention.StdCall)]
    private static extern int ZKFPM_DBCount(IntPtr hDBCache);

    [DllImport("libzkfp.dll", CallingConvention = CallingConvention.StdCall)]
    private static extern int ZKFPM_DBIdentify(IntPtr hDBCache, byte[] fpTemplate, ref int fid, ref int score);

    [DllImport("libzkfp.dll", CallingConvention = CallingConvention.StdCall)]
    private static extern int ZKFPM_DBMatch(IntPtr hDBCache, byte[] temp1, byte[] temp2);

    static int Main(string[] args)
    {
      try
      {
        if (args.Length == 0)
        {
          Console.WriteLine(JsonSerializer.Serialize(new { error = "no_args" }));
          return 1;
        }

        var cmd = args[0].ToLowerInvariant();
        switch (cmd)
        {
          case "--check":
            return RunCheck();
          case "--enroll":
            return RunEnroll();
          case "--identify":
            return RunIdentify();
          default:
            Console.WriteLine(JsonSerializer.Serialize(new { error = "unknown_cmd" }));
            return 1;
        }
      }
      catch (Exception ex)
      {
        Console.WriteLine(JsonSerializer.Serialize(new { error = ex.Message }));
        return 1;
      }
    }

    // Verifica carga de DLLs del SDK y devuelve flags de diagnóstico.
    static int RunCheck()
    {
      // Directorio del ejecutable y carpeta lib
      var exeDir = AppContext.BaseDirectory;
      var libDir = Path.Combine(exeDir, "lib");
      bool zkfingerFilesFound = Directory.Exists(libDir) &&
                           (File.Exists(Path.Combine(libDir, "zkfinger10.dll")) ||
                            File.Exists(Path.Combine(libDir, "zkfinger10-32.dll")));
      bool libzkfpFilesFound = Directory.Exists(libDir) &&
                            (File.Exists(Path.Combine(libDir, "libzkfp.dll")) ||
                             File.Exists(Path.Combine(libDir, "libzkfp-32.dll")));

      bool dllLoaded = false;
      string? loadedName = null;
      bool libzkfpLoaded = false;
      string? loadedLibzkfp = null;

      // Intento agregar libDir al path de carga de DLLs
      if (Directory.Exists(libDir))
      {
        SetDllDirectory(libDir);
      }

      // Intento cargar primero zkfinger10.dll, luego zkfinger10-32.dll
      foreach (var candidate in new[] { "zkfinger10.dll", "zkfinger10-32.dll" })
      {
        var path = Path.Combine(libDir, candidate);
        if (!File.Exists(path)) continue;
        var handle = LoadLibrary(path);
        if (handle != IntPtr.Zero)
        {
          dllLoaded = true;
          loadedName = candidate;
          // Libero inmediatamente (solo verificación de carga)
          FreeLibrary(handle);
          break;
        }
      }

      // Intento cargar libzkfp.dll (control del lector)
      foreach (var candidate in new[] { "libzkfp.dll", "libzkfp-32.dll" })
      {
        var path = Path.Combine(libDir, candidate);
        if (!File.Exists(path)) continue;
        var handle = LoadLibrary(path);
        if (handle != IntPtr.Zero)
        {
          libzkfpLoaded = true;
          loadedLibzkfp = candidate;
          FreeLibrary(handle);
          break;
        }
      }

      // Si libzkfp se cargó, intentamos inicializar y detectar el lector
      bool deviceConnected = false;
      int? deviceCount = null;
      if (libzkfpLoaded)
      {
        try
        {
          int retInit = ZKFPM_Init();
          if (retInit == 0)
          {
            int count = ZKFPM_GetDeviceCount();
            deviceCount = count;
            if (count > 0)
            {
              IntPtr hDev = ZKFPM_OpenDevice(0);
              if (hDev != IntPtr.Zero)
              {
                deviceConnected = true;
                ZKFPM_CloseDevice(hDev);
              }
            }
          }
        }
        catch
        {
        }
        finally
        {
          try { ZKFPM_Terminate(); } catch { }
        }
      }

      var payload = new
      {
        device_connected = deviceConnected, // actual
        sdk = "ZKFingerV10",
        device = "SLK20R",
        arch = "x86",
        zkfinger_files_found = zkfingerFilesFound,
        zkfinger_loaded = dllLoaded,
        loaded_dll = loadedName,
        libzkfp_files_found = libzkfpFilesFound,
        libzkfp_loaded = libzkfpLoaded,
        loaded_libzkfp = loadedLibzkfp,
        libzkfp_device_count = deviceCount
      };
      Console.WriteLine(JsonSerializer.Serialize(payload));
      return 0;
    }

    // Captura real y cifrado de plantilla con el SDK.
    static int RunEnroll()
    {
      var exeDir = AppContext.BaseDirectory;
      var libDir = Path.Combine(exeDir, "lib");
      if (Directory.Exists(libDir))
      {
        try { SetDllDirectory(libDir); } catch { }
      }

      // Controles por variables de entorno
      string? timeoutEnv = Environment.GetEnvironmentVariable("FP_CAPTURE_TIMEOUT_SEC");
      int timeoutSec = 30;
      if (!string.IsNullOrEmpty(timeoutEnv) && int.TryParse(timeoutEnv, out var t) && t > 0 && t <= 120) timeoutSec = t;

      string? pollEnv = Environment.GetEnvironmentVariable("FP_CAPTURE_POLL_MS");
      int pollMs = 120;
      if (!string.IsNullOrEmpty(pollEnv) && int.TryParse(pollEnv, out var p) && p >= 20 && p <= 1000) pollMs = p;

      string? forceDpiEnv = Environment.GetEnvironmentVariable("FP_FORCE_DPI");
      int forceDpi = 0;
      if (!string.IsNullOrEmpty(forceDpiEnv) && int.TryParse(forceDpiEnv, out var fd) && fd > 0) forceDpi = fd;

      string? saveAlwaysEnv = Environment.GetEnvironmentVariable("FP_SAVE_IMG_ALWAYS");
      bool saveImgAlways = !string.IsNullOrEmpty(saveAlwaysEnv) && (saveAlwaysEnv.Equals("1") || saveAlwaysEnv.Equals("true", StringComparison.OrdinalIgnoreCase));

      string? keepBmpEnvTop = Environment.GetEnvironmentVariable("FP_KEEP_BMP");
      bool keepBmpGlobal = !string.IsNullOrEmpty(keepBmpEnvTop) && (keepBmpEnvTop.Equals("1") || keepBmpEnvTop.Equals("true", StringComparison.OrdinalIgnoreCase));

      string? debugBmpPath = null;

      IntPtr hDev = IntPtr.Zero;
      bool initOk = false;
      try
      {
        int retInit = ZKFPM_Init();
        if (retInit != 0)
        {
          Console.WriteLine(JsonSerializer.Serialize(new { error = "init_failed", ret = retInit }));
          return 1;
        }
        initOk = true;

        int count = ZKFPM_GetDeviceCount();
        if (count <= 0)
        {
          Console.WriteLine(JsonSerializer.Serialize(new { error = "no_device" }));
          return 1;
        }

        hDev = ZKFPM_OpenDevice(0);
        if (hDev == IntPtr.Zero)
        {
          Console.WriteLine(JsonSerializer.Serialize(new { error = "open_failed" }));
          return 1;
        }

        int width = 0, height = 0, dpi = 0;
        int retCap = 0;
        try { retCap = ZKFPM_GetCaptureParamsEx(hDev, ref width, ref height, ref dpi); } catch { retCap = -1; }
        if (retCap != 0 || width <= 0 || height <= 0)
        {
          width = 256;
          height = 360;
          dpi = 500;
        }
        // Validación/forzado de DPI
        if (forceDpi > 0) dpi = forceDpi;
        if (dpi <= 0) dpi = 500;

        uint imgSize = (uint)(width * height);
        var fpImage = new byte[imgSize];
        var fpTemplateBuf = new byte[4096];
        uint cbTemplate = (uint)fpTemplateBuf.Length;

        int retAcq = -1;
        var sw = Stopwatch.StartNew();
        while (sw.Elapsed < TimeSpan.FromSeconds(timeoutSec))
        {
          cbTemplate = (uint)fpTemplateBuf.Length; // reset size before each call
          retAcq = ZKFPM_AcquireFingerprint(hDev, fpImage, imgSize, fpTemplateBuf, ref cbTemplate);
          if (retAcq == 0 && cbTemplate > 0)
          {
            break;
          }
          Thread.Sleep(pollMs);
        }
        if (retAcq != 0 || cbTemplate == 0)
        {
          // Fallback: captura solo imagen y extrae plantilla desde BMP
          int retImg = -1;
          var swImg = Stopwatch.StartNew();
          while (swImg.Elapsed < TimeSpan.FromSeconds(timeoutSec))
          {
            try { retImg = ZKFPM_AcquireFingerprintImage(hDev, fpImage, imgSize); } catch { retImg = -1; }
            if (retImg == 0) break;
            Thread.Sleep(pollMs);
          }
          if (retImg == 0)
          {
            var tmpBmp = Path.Combine(Path.GetTempPath(), $"slk20r_capture_{Guid.NewGuid():N}.bmp");
            try
            {
              WriteGrayscaleBmp(tmpBmp, width, height, fpImage);
              // Permitir conservar el BMP de fallback para diagnóstico
              var keepBmpEnv = Environment.GetEnvironmentVariable("FP_KEEP_BMP");
              bool keepBmp = !string.IsNullOrEmpty(keepBmpEnv) && (keepBmpEnv.Equals("1") || keepBmpEnv.Equals("true", StringComparison.OrdinalIgnoreCase));
              IntPtr hDb = IntPtr.Zero;
              try
              {
                hDb = ZKFPM_DBInit();
                if (hDb != IntPtr.Zero)
                {
                  cbTemplate = (uint)fpTemplateBuf.Length;
                  int retExt = ZKFPM_ExtractFromImage(hDb, tmpBmp, (uint)dpi, fpTemplateBuf, ref cbTemplate);
                  if (retExt == 0 && cbTemplate > 0)
                  {
                    retAcq = 0; // éxito por fallback
                    // Conservar siempre si se solicita globalmente o siempre
                    if (keepBmpGlobal || saveImgAlways)
                    {
                      debugBmpPath = tmpBmp;
                    }
                    else
                    {
                      try { File.Delete(tmpBmp); } catch { }
                    }
                  }
                  else
                  {
                    Console.WriteLine(JsonSerializer.Serialize(new { error = "acquire_failed", ret = retAcq, fallback_img = retImg, extract_ret = retExt, fallback_bmp_path = (keepBmpGlobal || saveImgAlways) ? tmpBmp : null }));
                    // Si no se pidió conservar, limpiamos
                    if (!(keepBmpGlobal || saveImgAlways))
                    {
                      try { File.Delete(tmpBmp); } catch { }
                    }
                    return 1;
                  }
                }
                else
                {
                  Console.WriteLine(JsonSerializer.Serialize(new { error = "acquire_failed", ret = retAcq, fallback_img = retImg, extract_ret = -100, fallback_bmp_path = (keepBmpGlobal || saveImgAlways) ? tmpBmp : null }));
                  if (!(keepBmpGlobal || saveImgAlways))
                  {
                    try { File.Delete(tmpBmp); } catch { }
                  }
                  return 1;
                }
              }
              finally
              {
                if (hDb != IntPtr.Zero) { try { ZKFPM_DBFree(hDb); } catch { } }
              }
            }
            catch
            {
              var keepBmpEnvCatch = Environment.GetEnvironmentVariable("FP_KEEP_BMP");
              bool keepBmpCatch = !string.IsNullOrEmpty(keepBmpEnvCatch) && (keepBmpEnvCatch.Equals("1") || keepBmpEnvCatch.Equals("true", StringComparison.OrdinalIgnoreCase));
              Console.WriteLine(JsonSerializer.Serialize(new { error = "acquire_failed", ret = retAcq, fallback_img = retImg, extract_ret = -101, fallback_bmp_path = (keepBmpGlobal || saveImgAlways) ? tmpBmp : null }));
              if (!(keepBmpGlobal || saveImgAlways))
              {
                try { File.Delete(tmpBmp); } catch { }
              }
              return 1;
            }
          }
          else
          {
            Console.WriteLine(JsonSerializer.Serialize(new { error = "acquire_failed", ret = retAcq, fallback_img = retImg }));
            return 1;
          }
        }

        var fpTemplate = new byte[cbTemplate];
        Array.Copy(fpTemplateBuf, fpTemplate, (int)cbTemplate);

        string? keyB64 = Environment.GetEnvironmentVariable("FP_ENC_KEY_B64");
        if (string.IsNullOrWhiteSpace(keyB64))
        {
          Console.WriteLine(JsonSerializer.Serialize(new { error = "missing_enc_key", env = "FP_ENC_KEY_B64" }));
          return 1;
        }

        byte[] key;
        try { key = Convert.FromBase64String(keyB64); }
        catch { Console.WriteLine(JsonSerializer.Serialize(new { error = "invalid_key_base64" })); return 1; }

        if (key.Length != 32)
        {
          Console.WriteLine(JsonSerializer.Serialize(new { error = "invalid_key_size", expected_bytes = 32, got = key.Length }));
          return 1;
        }

        var nonce = new byte[12];
        RandomNumberGenerator.Fill(nonce);
        var ciphertext = new byte[fpTemplate.Length];
        var tag = new byte[16];

        try
        {
          using var aes = new AesGcm(key, tag.Length);
          aes.Encrypt(nonce, fpTemplate, ciphertext, tag, associatedData: Encoding.UTF8.GetBytes("ZKFingerV10"));
        }
        catch (Exception ex)
        {
          Console.WriteLine(JsonSerializer.Serialize(new { error = "encrypt_failed", message = ex.Message }));
          return 1;
        }

        var payload = new
        {
          format = "ZKFingerV10",
          template_len = (int)cbTemplate,
          image_width = width,
          image_height = height,
          dpi = dpi,
          enc_ciphertext_b64 = Convert.ToBase64String(ciphertext),
          enc_nonce_b64 = Convert.ToBase64String(nonce),
          enc_tag_b64 = Convert.ToBase64String(tag),
          debug_image_bmp_path = debugBmpPath
        };
        Console.WriteLine(JsonSerializer.Serialize(payload));
        return 0;
      }
      catch (Exception ex)
      {
        Console.WriteLine(JsonSerializer.Serialize(new { error = ex.Message }));
        return 1;
      }
      finally
      {
        if (hDev != IntPtr.Zero)
        {
          try { ZKFPM_CloseDevice(hDev); } catch { }
        }
        if (initOk)
        {
          try { ZKFPM_Terminate(); } catch { }
        }
      }
      
    }

    // Escribe un BMP de 8bpp (paleta gris) a partir de bytes de imagen (width*height)
    private static void WriteGrayscaleBmp(string path, int width, int height, byte[] pixels)
    {
      int rowStride = ((width + 3) / 4) * 4; // alineación a 4 bytes
      int imageSize = rowStride * height;
      int paletteSize = 256 * 4; // RGBA por entrada
      int headerSize = 14 + 40; // FILE + INFO
      int offBits = headerSize + paletteSize;
      int fileSize = offBits + imageSize;

      using (var fs = new FileStream(path, FileMode.Create, FileAccess.Write))
      using (var bw = new BinaryWriter(fs))
      {
        // BITMAPFILEHEADER
        bw.Write((ushort)0x4D42);            // 'BM'
        bw.Write(fileSize);                  // bfSize
        bw.Write((ushort)0);                 // bfReserved1
        bw.Write((ushort)0);                 // bfReserved2
        bw.Write(offBits);                   // bfOffBits

        // BITMAPINFOHEADER
        bw.Write(40);                        // biSize
        bw.Write(width);                     // biWidth
        bw.Write(height);                    // biHeight (positivo -> bottom-up)
        bw.Write((ushort)1);                 // biPlanes
        bw.Write((ushort)8);                 // biBitCount
        bw.Write(0);                         // biCompression (BI_RGB)
        bw.Write(imageSize);                 // biSizeImage
        bw.Write(0);                         // biXPelsPerMeter
        bw.Write(0);                         // biYPelsPerMeter
        bw.Write(256);                       // biClrUsed
        bw.Write(256);                       // biClrImportant

        // Paleta: 256 entradas gris (B,G,R,0)
        for (int i = 0; i < 256; i++)
        {
          bw.Write((byte)i); // B
          bw.Write((byte)i); // G
          bw.Write((byte)i); // R
          bw.Write((byte)0); // A
        }

        // Datos: bottom-up con padding
        var pad = new byte[rowStride - width];
        for (int y = height - 1; y >= 0; y--)
        {
          int srcOffset = y * width;
          bw.Write(pixels, srcOffset, width);
          if (pad.Length > 0) bw.Write(pad);
        }
      }
    }
}
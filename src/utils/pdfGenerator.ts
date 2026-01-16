import { jsPDF } from "jspdf";

interface RoutineData {
  rutina: {
    nombre: string;
    dias: string[];
    notas?: string;
  };
  detalle: any[]; // Using any[] for now to match flexible Supabase response, ideally strict type
}

export const generateRoutinePDF = async (rutinaVista: RoutineData, toast: any) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    
    let yPosition = margin;
    
    // Título de la rutina
    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    pdf.text(rutinaVista?.rutina?.nombre || 'Rutina de Ejercicios', margin, yPosition);
    yPosition += 10;
    
    // Días de la rutina
    if (rutinaVista?.rutina?.dias && rutinaVista.rutina.dias.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Días: ${rutinaVista.rutina.dias.join(', ')}`, margin, yPosition);
      yPosition += 10;
    }
    
    // Notas si existen
    if (rutinaVista?.rutina?.notas) {
      pdf.setFontSize(11);
      pdf.text('Notas:', margin, yPosition);
      yPosition += 5;
      
      // Dividir notas en líneas si son largas
      const notasLines = pdf.splitTextToSize(rutinaVista.rutina.notas, contentWidth);
      pdf.text(notasLines, margin, yPosition);
      yPosition += notasLines.length * 5 + 5;
    }
    
    // Procesar ejercicios por días
    const detalle = (rutinaVista?.detalle || []) as any[];
    const tieneDia = detalle.some(d => d.dia);
    
    // Función auxiliar para cargar imágenes
    const cargarImagen = (url: string): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 80;
          canvas.height = 60;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Establecer fondo blanco
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Dibujar la imagen encima del fondo blanco
            ctx.drawImage(img, 0, 0, 80, 60);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve('');
          }
        };
        img.onerror = () => resolve('');
        img.src = url;
      });
    };
    
    if (tieneDia) {
      // Agrupar por días
      const grupos: Record<string, any[]> = {};
      for (const it of detalle) {
        // Normalizar clave del día para agrupación, manejando tanto nombres como números si es necesario
        // Pero idealmente usaremos el string del día tal cual viene de la base de datos
        const key = String(it.dia || 'General'); 
        if (!grupos[key]) grupos[key] = [];
        grupos[key].push(it);
      }
      
      // Orden personalizado para días de la semana
      const dayOrder = ['lunes', 'martes', 'miércoles', 'miercoles', 'jueves', 'viernes', 'sábado', 'sabado', 'domingo'];
      
      const diasOrdenados = Object.keys(grupos).sort((a, b) => {
        // Intentar ordenar numéricamente primero (por compatibilidad hacia atrás)
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        
        // Si no son números, usar orden de días de semana
        const indexA = dayOrder.indexOf(a.toLowerCase());
        const indexB = dayOrder.indexOf(b.toLowerCase());
        
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        
        return a.localeCompare(b);
      });
      
      for (let diaIndex = 0; diaIndex < diasOrdenados.length; diaIndex++) {
        const diaKey = diasOrdenados[diaIndex];
        
        // Salto de página para cada día (excepto el primero si cabe)
        if (diaIndex > 0) {
          pdf.addPage();
          yPosition = margin;
        } else if (yPosition > pageHeight - 50) {
             // Si el encabezado ocupó mucho espacio, saltar página para el primer día también
            pdf.addPage();
            yPosition = margin;
        }
        
        // Título del día (Capitalizado)
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        const diaTitle = isNaN(parseInt(diaKey)) 
            ? diaKey.charAt(0).toUpperCase() + diaKey.slice(1) 
            : `Día ${diaKey}`;
            
        pdf.text(diaTitle, margin, yPosition);
        yPosition += 15;
        
        // Ejercicios del día
        const ejerciciosDia = grupos[diaKey];
        
        for (let ejIndex = 0; ejIndex < ejerciciosDia.length; ejIndex++) {
          const item = ejerciciosDia[ejIndex];
          const ejercicio = item.ejercicios;
          if (!ejercicio) continue;
          
          yPosition = await renderExerciseItem(pdf, ejercicio, item, ejIndex + 1, yPosition, margin, contentWidth, pageHeight, cargarImagen);
          
          // Línea separadora (solo si no es el último ejercicio del día)
          if (ejIndex < ejerciciosDia.length - 1) {
            pdf.setDrawColor(200, 200, 200);
            pdf.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 8;
          }
        }
      }
    } else {
      // Sin días, mostrar todos los ejercicios
      for (let index = 0; index < detalle.length; index++) {
        const item = detalle[index];
        const ejercicio = item.ejercicios;
        if (!ejercicio) continue;
        
        yPosition = await renderExerciseItem(pdf, ejercicio, item, index + 1, yPosition, margin, contentWidth, pageHeight, cargarImagen);

         // Línea separadora
         if (index < detalle.length - 1) {
            pdf.setDrawColor(200, 200, 200);
            pdf.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 8;
          }
      }
    }
    
    const nombre = (rutinaVista?.rutina?.nombre || 'rutina').replace(/\s+/g, '_');
    const fecha = new Date().toISOString().slice(0, 10);
    pdf.save(`${nombre}_${fecha}.pdf`);
    
  } catch (err) {
    console.error('Error exportando PDF', err);
    toast({ variant: 'destructive', title: 'Error', description: 'No se pudo exportar la rutina a PDF.' });
  }
};

async function renderExerciseItem(
    pdf: jsPDF, 
    ejercicio: any, 
    item: any, 
    index: number, 
    yPosition: number, 
    margin: number, 
    contentWidth: number, 
    pageHeight: number,
    cargarImagen: (url: string) => Promise<string>
): Promise<number> {
    // Calcular espacio necesario para este ejercicio
    let espacioNecesario = 30; // Espacio base para imagen + detalles básicos
    if (ejercicio.descripcion) {
      const descLines = pdf.splitTextToSize(ejercicio.descripcion, contentWidth - 30);
      espacioNecesario += descLines.length * 4 + 5;
    }
    
    // Verificar si necesitamos nueva página
    if (yPosition + espacioNecesario > pageHeight - 20) {
      pdf.addPage();
      yPosition = margin;
    }
    
    // Cargar y agregar imagen si existe
    if (ejercicio.imagen_url) {
      try {
        const imgData = await cargarImagen(ejercicio.imagen_url);
        if (imgData) {
          pdf.addImage(imgData, 'JPEG', margin, yPosition, 25, 20);
        }
      } catch (error) {
        console.warn('Error al cargar imagen:', error);
      }
    }
    
    // Nombre del ejercicio (a la derecha de la imagen)
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text(`${index}. ${ejercicio.nombre}`, margin + 30, yPosition + 7);
    
    // Detalles del ejercicio
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');
    
    const detalles = [];
    if (item.series) detalles.push(`Series: ${item.series}`);
    if (item.repeticiones) detalles.push(`Reps: ${item.repeticiones}`);
    if (item.tempo) detalles.push(`Tempo: ${item.tempo}`);
    if (item.descanso) detalles.push(`Descanso: ${item.descanso}`);
    
    let currentY = yPosition;

    if (detalles.length > 0) {
      pdf.text(detalles.join(' | '), margin + 30, currentY + 15);
      currentY += 25;
    } else {
        currentY += 20;
    }
    
    // Descripción si existe
    if (ejercicio.descripcion) {
      const descLines = pdf.splitTextToSize(ejercicio.descripcion, contentWidth - 30);
      pdf.text(descLines, margin + 30, currentY);
      currentY += descLines.length * 4 + 5;
    } else {
        currentY += 5;
    }

    // Retornamos la nueva posición Y
    // Ajustamos retorno para asegurar que si la imagen era más alta que el texto, respetemos eso
    // La imagen tiene altura 20 fija + marginY.
    const imageBottom = yPosition + 25; 
    return Math.max(currentY, imageBottom + 5);
}

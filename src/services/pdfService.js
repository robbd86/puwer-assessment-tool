import { jsPDF } from 'jspdf';

// Helper to fetch image as data URL
async function fetchImageAsDataURL(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

// Helper function to fix image orientation
async function fixImageOrientation(dataUrl, maxWidth, maxHeight) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate aspect ratio to maintain proportions
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        // Landscape orientation
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        // Portrait or square orientation
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw image with proper orientation
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert back to data URL
      resolve({
        dataUrl: canvas.toDataURL('image/jpeg', 0.85),
        width,
        height
      });
    };
    img.src = dataUrl;
  });
}

// Modernized and async: embed photos
export const generatePDF = async (assessment, questions) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 40;

  // Header with title
  doc.setFillColor('#007bff');
  doc.rect(0, 0, pageWidth, 60, 'F');
  doc.setFontSize(22);
  doc.setTextColor('#fff');
  doc.setFont('helvetica', 'bold');
  doc.text('PUWER Assessment Report', pageWidth / 2, 38, { align: 'center' });
  y = 70;

  // Equipment summary
  doc.setFontSize(12);
  doc.setTextColor('#222');
  doc.setFont('helvetica', 'normal');
  doc.text(`Equipment: ${assessment.equipmentDetails.name || 'Not specified'}`, 40, y);
  doc.text(`Location: ${assessment.equipmentDetails.location || 'Not specified'}`, 40, y + 18);
  doc.text(`Reference: ${assessment.equipmentDetails.reference || 'Not specified'}`, 40, y + 36);
  doc.text(`Assessor: ${assessment.equipmentDetails.assessor || 'Not specified'}`, 40, y + 54);
  doc.text(`Date: ${new Date(assessment.createdAt).toLocaleDateString()}`, 40, y + 72);
  y += 100;

  // Add Nameplate / Machine Info text if present
  if (assessment.equipmentDetails?.nameplateInfo) {
    doc.setFontSize(13);
    doc.setTextColor('#007bff');
    doc.text('Nameplate / Machine Info:', 40, y);
    doc.setFontSize(12);
    doc.setTextColor('#222');
    const infoLines = doc.splitTextToSize(assessment.equipmentDetails.nameplateInfo, pageWidth - 80);
    doc.text(infoLines, 40, y + 16);
    y += 16 + (infoLines.length * 14);
  }

  // Add nameplate/machine info photos if present
  const nameplatePhotos = assessment.equipmentDetails?.nameplatePhotos || [];
  if (nameplatePhotos.length > 0) {
    doc.setFontSize(13);
    doc.setTextColor('#007bff');
    doc.text('Nameplate / Machine Info Photos:', 40, y);
    y += 20;
    let photoX = 40;
    let maxHeight = 0;
    
    for (const photo of nameplatePhotos) {
      try {
        // Fix image orientation and respect aspect ratio
        const maxPhotoWidth = 140;
        const maxPhotoHeight = 105;
        
        // Process the image to fix orientation and maintain aspect ratio
        const processedImage = await fixImageOrientation(
          photo.dataUrl, 
          maxPhotoWidth, 
          maxPhotoHeight
        );
        
        // Add the processed image
        doc.addImage(
          processedImage.dataUrl, 
          'JPEG', 
          photoX, 
          y, 
          processedImage.width, 
          processedImage.height
        );
        
        photoX += processedImage.width + 20;
        
        if (processedImage.height > maxHeight) 
          maxHeight = processedImage.height;
        
        // Wrap to next line if too wide
        if (photoX + maxPhotoWidth > pageWidth - 40) {
          photoX = 40;
          y += maxHeight + 15;
          maxHeight = 0;
        }
      } catch (e) {
        console.error('Error processing photo:', e);
        doc.setTextColor('#dc3545');
        doc.text('Photo could not be loaded', photoX, y + 20);
        doc.setTextColor('#222');
        photoX += 110;
      }
    }
    y += maxHeight + 25;
  }

  // Summary box
  const totalQuestions = questions.length;
  const answered = Object.keys(assessment.answers).length;
  const completion = totalQuestions ? Math.round((answered / totalQuestions) * 100) : 0;
  const yes = Object.values(assessment.answers).filter(a => a.answer === 'yes').length;
  const no = Object.values(assessment.answers).filter(a => a.answer === 'no').length;
  const na = Object.values(assessment.answers).filter(a => a.answer === 'na').length;
  doc.setFillColor('#f8f9fa');
  doc.roundedRect(30, y, pageWidth - 60, 60, 8, 8, 'F');
  doc.setFontSize(13);
  doc.setTextColor('#007bff');
  doc.setFont('helvetica', 'bold');
  doc.text(`Summary`, 40, y + 22);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#222');
  doc.text(`Completion: ${completion}%`, 140, y + 22);
  doc.setTextColor('#28a745');
  doc.text(`Compliant: ${yes}`, 260, y + 22);
  doc.setTextColor('#dc3545');
  doc.text(`Non-Compliant: ${no}`, 370, y + 22);
  doc.setTextColor('#6c757d');
  doc.text(`N/A: ${na}`, 520, y + 22);
  y += 80;

  // Sectioned questions
  const sections = {};
  questions.forEach(q => {
    if (!sections[q.section]) sections[q.section] = [];
    sections[q.section].push(q);
  });

  for (const [section, sectionQuestions] of Object.entries(sections)) {
    if (y > 700) { doc.addPage(); y = 40; }
    // Section header
    doc.setFillColor('#e9ecef');
    doc.roundedRect(30, y, pageWidth - 60, 28, 6, 6, 'F');
    doc.setFontSize(14);
    doc.setTextColor('#007bff');
    doc.setFont('helvetica', 'bold');
    doc.text(`Section ${section}`, 40, y + 19);
    y += 38;
    // Table header
    doc.setFontSize(11);
    doc.setTextColor('#222');
    doc.setFont('helvetica', 'bold');
    doc.text('Reg.', 40, y);
    doc.text('Question', 90, y);
    doc.text('Answer', pageWidth - 180, y);
    doc.text('Comments', pageWidth - 120, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    for (const question of sectionQuestions) {
      if (y > 770) { doc.addPage(); y = 40; }
      const answer = assessment.answers[question.regulationNumber];
      // Question row background
      doc.setFillColor('#fff');
      doc.rect(30, y - 7, pageWidth - 60, 28, 'F');
      // Regulation number
      doc.setTextColor('#007bff');
      doc.text(`${question.regulationNumber}`, 40, y + 7);
      // Question text
      doc.setTextColor('#222');
      doc.text(doc.splitTextToSize(question.text, pageWidth - 320), 90, y + 7);
      // Answer with color
      if (answer) {
        let color = '#6c757d';
        if (answer.answer === 'yes') color = '#28a745';
        if (answer.answer === 'no') color = '#dc3545';
        doc.setTextColor(color);
        doc.text(answer.answer.toUpperCase(), pageWidth - 180, y + 7);
        doc.setTextColor('#222');
        // Comments
        if (answer.comments) {
          doc.text(doc.splitTextToSize(answer.comments, 90), pageWidth - 120, y + 7);
        }
        // Embed photos (if any)
        if (answer.photos && answer.photos.length > 0) {
          let photoY = y + 30;
          for (const photo of answer.photos) {
            try {
              // Get the photo data URL
              const dataUrl = photo.dataUrl || await fetchImageAsDataURL(photo.url);
              
              // Fix orientation and size
              const maxWidth = 180;
              const maxHeight = 135;
              const processedImage = await fixImageOrientation(dataUrl, maxWidth, maxHeight);
              
              // Add properly oriented image
              doc.addImage(
                processedImage.dataUrl,
                'JPEG',
                90,
                photoY,
                processedImage.width,
                processedImage.height
              );
              
              photoY += processedImage.height + 10;
              
              if (photoY > 770) { 
                doc.addPage(); 
                photoY = 40; 
              }
            } catch (e) {
              console.error('Error processing question photo:', e);
              doc.setTextColor('#dc3545');
              doc.text('Photo could not be loaded', 90, photoY);
              doc.setTextColor('#222');
              photoY += 20;
            }
          }
          y = photoY;
        }
      } else {
        doc.setTextColor('#6c757d');
        doc.text('N/A', pageWidth - 180, y + 7);
      }
      y += 28;
    }
    y += 10;
  }

  // Recommendations
  if (assessment.recommendations && assessment.recommendations.length > 0) {
    if (y > 700) { doc.addPage(); y = 40; }
    doc.setFillColor('#f8f9fa');
    doc.roundedRect(30, y, pageWidth - 60, 28, 6, 6, 'F');
    doc.setFontSize(14);
    doc.setTextColor('#007bff');
    doc.setFont('helvetica', 'bold');
    doc.text('Recommendations', 40, y + 19);
    y += 38;
    for (const rec of assessment.recommendations) {
      if (y > 770) { doc.addPage(); y = 40; }
      doc.setFontSize(11);
      doc.setTextColor('#222');
      doc.setFont('helvetica', 'normal');
      doc.text(doc.splitTextToSize(rec.text, pageWidth - 80), 40, y + 7);
      y += 18;
      doc.setTextColor('#007bff');
      doc.text(`Priority: `, 40, y + 7);
      let color = '#6c757d';
      if (rec.priority === 'High') color = '#dc3545';
      if (rec.priority === 'Medium') color = '#ffc107';
      if (rec.priority === 'Low') color = '#28a745';
      doc.setTextColor(color);
      doc.text(`${rec.priority}`, 90, y + 7);
      doc.setTextColor('#222');
      doc.text(`Assignee: ${rec.assignee || 'N/A'}`, 180, y + 7);
      doc.text(`Due: ${rec.dueDate || 'N/A'}`, 350, y + 7);
      y += 22;
    }
  }

  return doc;
};

/**
 * Save PDF document with a named based on assessment details
 * @param {jsPDF} doc - The PDF document to save
 * @param {Object} assessment - The assessment object
 */
export const savePDF = (doc, assessment) => {
  const filename = `PUWER_Assessment_${assessment.equipmentDetails.name || 'Unnamed'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
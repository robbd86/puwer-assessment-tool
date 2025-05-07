import React, { useRef, useState } from 'react';
import { Button, Modal, Alert, Spinner } from 'react-bootstrap';
import './styles.css';

const PhotoUploader = ({ photos = [], onChange }) => {
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    setError(null);
    
    try {
      const newPhotos = [];
      
      for (const file of files) {
        try {
          // Generate a simple ID
          const id = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
          
          // Convert file to base64
          const base64 = await fileToBase64(file);
          
          console.log(`File converted to base64: ${file.name} (${Math.round(base64.length / 1024)} KB)`);
          
          newPhotos.push({
            id,
            url: base64,
            dataUrl: base64, // For backward compatibility with any code using dataUrl
            name: file.name,
            type: file.type,
            size: file.size,
            timestamp: new Date().toISOString()
          });
        } catch (err) {
          console.error('Error processing file:', file.name, err);
          setError(`Error processing ${file.name}: ${err.message || 'Unknown error'}`);
        }
      }
      
      if (newPhotos.length > 0) {
        console.log(`Successfully added ${newPhotos.length} photos`);
        onChange([...photos, ...newPhotos]);
      } else {
        setError('No files were added. Please try again.');
      }
    } catch (e) {
      console.error('Error handling files:', e);
      setError('Error adding photos: ' + (e.message || 'Unknown error'));
    } finally {
      event.target.value = ''; // Clear input
      setUploading(false);
    }
  };

  const handleRemovePhoto = (photoId) => {
    const updatedPhotos = photos.filter(photo => photo.id !== photoId);
    onChange(updatedPhotos);
  };

  const handleShowPreview = (photo) => {
    setPreviewImage(photo);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewImage(null);
  };

  return (
    <div className="photo-uploader">
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div><strong>Evidence Photos:</strong> {photos.length > 0 && `(${photos.length})`}</div>
        <Button 
          variant="outline-primary" 
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              <span className="ms-1">Processing...</span>
            </>
          ) : '+ Add Photos'}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          disabled={uploading}
        />
      </div>
      
      {photos.length > 0 && (
        <div className="photos-container">
          {photos.map(photo => (
            <div key={photo.id} className="photo-item">
              <img 
                src={photo.url} 
                alt={photo.name || "Evidence"}
                className="photo-thumbnail" 
                onClick={() => handleShowPreview(photo)}
              />
              <Button
                variant="danger"
                size="sm"
                className="photo-delete-btn"
                onClick={() => handleRemovePhoto(photo.id)}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}
      
      <Modal show={showPreview} onHide={handleClosePreview} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{previewImage?.name || 'Photo Evidence'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {previewImage && (
            <img
              src={previewImage.url}
              alt={previewImage.name || "Evidence"}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '70vh'
              }}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClosePreview}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PhotoUploader;
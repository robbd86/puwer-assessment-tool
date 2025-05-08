import React, { useRef, useState } from 'react';
import { Button, Modal, Alert, Spinner } from 'react-bootstrap';
import './styles.css';

const PhotoUploader = ({ photos = [], onChange }) => {
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileSelect = async (event) => {
    try {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;
      
      setIsLoading(true);
      setErrorMessage('');
      
      // Create an array to store temp photos
      const tempPhotos = [];
      
      // Process each file one by one
      for (const file of files) {
        // Convert to data URL for persistence
        const dataUrl = await readFileAsDataURL(file);
        
        // Create a local URL for preview
        const localUrl = URL.createObjectURL(file);
        
        // Create a new photo object
        const newPhoto = {
          id: `photo_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          url: localUrl, // For preview
          dataUrl: dataUrl, // For storage
          name: file.name,
          size: file.size,
          type: file.type,
          createdAt: new Date().toISOString()
        };
        
        // Add it to our temp photos array
        tempPhotos.push(newPhoto);
      }
      
      // Add all processed photos to the existing photos
      onChange([...photos, ...tempPhotos]);
      
      // Clear the file input
      event.target.value = '';
    } catch (error) {
      console.error('Error processing photos:', error);
      setErrorMessage('Failed to process photos. Please try a different image.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to read a file as data URL
  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (photoId) => {
    // Find the photo to remove
    const photoToRemove = photos.find(p => p.id === photoId);
    
    // If it has a blob URL, revoke it to prevent memory leaks
    if (photoToRemove && photoToRemove.url && photoToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(photoToRemove.url);
    }
    
    // Remove from the photos array
    const updatedPhotos = photos.filter(p => p.id !== photoId);
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
      {errorMessage && (
        <Alert variant="danger" dismissible onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}
      
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <strong>Evidence Photos:</strong> {photos.length > 0 && `(${photos.length})`}
        </div>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner as="span" size="sm" animation="border" role="status" aria-hidden="true" />
              <span className="ms-2">Processing...</span>
            </>
          ) : '+ Add Photos'}
        </Button>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
      </div>
      
      {photos.length > 0 && (
        <div className="photos-container">
          {photos.map(photo => (
            <div key={photo.id} className="photo-item">
              <img
                src={photo.url || photo.dataUrl}
                alt={photo.name || "Photo evidence"}
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
              src={previewImage.url || previewImage.dataUrl}
              alt={previewImage.name || "Evidence photo"}
              style={{ maxWidth: '100%', maxHeight: '70vh' }}
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
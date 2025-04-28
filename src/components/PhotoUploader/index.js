import React, { useRef, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';

const PhotoUploader = ({ photos = [], onChange }) => {
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Convert uploaded files to data URLs (in-memory only)
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const processFiles = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            dataUrl: e.target.result,
            name: file.name,
            type: file.type,
            size: file.size,
            timestamp: new Date().toISOString()
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(processFiles).then(newPhotos => {
      onChange([...photos, ...newPhotos]);
    });
    event.target.value = '';
  };

  // Remove a photo
  const handleRemovePhoto = (photoId) => {
    const updatedPhotos = photos.filter(photo => photo.id !== photoId);
    onChange(updatedPhotos);
  };

  // Show photo preview
  const handleShowPreview = (photo) => {
    setPreviewImage(photo);
    setShowPreview(true);
  };

  // Close preview modal
  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewImage(null);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div><strong>Evidence Photos:</strong> {photos.length > 0 && `(${photos.length})`}</div>
        <Button 
          variant="outline-primary" 
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          + Add Photos
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          multiple
          style={{ display: 'none' }}
        />
      </div>
      {photos.length > 0 && (
        <div className="photos-container">
          {photos.map(photo => (
            <div key={photo.id} className="position-relative">
              <img 
                src={photo.dataUrl} 
                alt="Evidence" 
                className="photo-thumbnail" 
                onClick={() => handleShowPreview(photo)}
              />
              <Button
                variant="danger"
                size="sm"
                className="position-absolute top-0 end-0"
                style={{ padding: '0 4px', fontSize: '10px' }}
                onClick={() => handleRemovePhoto(photo.id)}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}
      {/* Preview Modal */}
      <Modal show={showPreview} onHide={handleClosePreview} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{previewImage?.name || 'Photo Evidence'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {previewImage && (
            <img
              src={previewImage.dataUrl}
              alt="Evidence"
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
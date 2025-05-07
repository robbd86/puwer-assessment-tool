import React, { useRef, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { supabase } from '../../services/supabase';
import { v4 as uuidv4 } from 'uuid';

const PhotoUploader = ({ photos = [], onChange }) => {
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      const uploadPromises = files.map(async (file) => {
        try {
          // Create a truly unique filename with UUID and timestamp
          const uniqueId = uuidv4();
          const timestamp = Date.now();
          const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const filePath = `photos/${uniqueId}-${timestamp}-${safeFilename}`;
          
          const bucketName = 'puwer';
          
          console.log('Uploading file to Supabase:', filePath);
          const { error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file);
            
          if (error) {
            console.error('Supabase upload error:', error);
            throw error;
          }
          
          const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);
            
          if (!publicUrlData || !publicUrlData.publicUrl) {
            console.error('Failed to get public URL for uploaded file');
            throw new Error('Failed to get public URL');
          }
          
          console.log('File uploaded successfully, URL:', publicUrlData.publicUrl);
          return {
            id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url: publicUrlData.publicUrl,
            name: file.name,
            type: file.type,
            size: file.size,
            timestamp: new Date().toISOString()
          };
        } catch (err) {
          console.error('Error uploading individual file:', err);
          // Return a placeholder for failed uploads
          return null;
        }
      });
      
      const uploadedPhotos = await Promise.all(uploadPromises);
      // Filter out any failed uploads (null values)
      const successfulUploads = uploadedPhotos.filter(photo => photo !== null);
      
      if (successfulUploads.length === 0) {
        alert('Failed to upload photos. Please check console for errors.');
        return;
      }
      
      onChange([...photos, ...successfulUploads]);
      event.target.value = '';
    } catch (error) {
      console.error('Error in overall upload process:', error);
      alert('Failed to upload photos. Please try again.');
      event.target.value = '';
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
                src={photo.url} 
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
      <Modal show={showPreview} onHide={handleClosePreview} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{previewImage?.name || 'Photo Evidence'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {previewImage && (
            <img
              src={previewImage.url}
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
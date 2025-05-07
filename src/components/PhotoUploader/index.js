import React, { useRef, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { supabase } from '../../services/supabase';

const PhotoUploader = ({ photos = [], onChange }) => {
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Generate a unique ID without using external packages
  const generateUniqueId = () => {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    console.log('Starting upload for', files.length, 'files');

    try {
      const uploadPromises = files.map(async (file) => {
        try {
          // Create a unique filename using timestamp and random string
          const uniqueId = generateUniqueId();
          const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const filePath = `photos/${uniqueId}_${safeFilename}`;
          
          console.log('Uploading file to Supabase bucket "puwer":', filePath);
          
          const { error } = await supabase.storage
            .from('puwer')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });
            
          if (error) {
            console.error('Supabase upload error:', error);
            throw error;
          }
          
          console.log('File uploaded successfully, getting URL');
          
          const { data: publicUrlData } = supabase.storage
            .from('puwer')
            .getPublicUrl(filePath);
            
          if (!publicUrlData || !publicUrlData.publicUrl) {
            console.error('Failed to get public URL for uploaded file');
            throw new Error('Failed to get public URL');
          }
          
          console.log('File URL:', publicUrlData.publicUrl);
          
          return {
            id: generateUniqueId(),
            url: publicUrlData.publicUrl,
            name: file.name,
            type: file.type,
            size: file.size,
            timestamp: new Date().toISOString()
          };
        } catch (err) {
          console.error('Error uploading individual file:', err);
          return null;
        }
      });
      
      const uploadedPhotos = await Promise.all(uploadPromises);
      const successfulUploads = uploadedPhotos.filter(photo => photo !== null);
      
      if (successfulUploads.length === 0) {
        alert('Failed to upload photos. Check console for details.');
        return;
      }
      
      console.log('Successfully uploaded', successfulUploads.length, 'photos');
      onChange([...photos, ...successfulUploads]);
    } catch (error) {
      console.error('Error in overall upload process:', error);
      alert('Error uploading photos: ' + error.message);
    } finally {
      event.target.value = '';
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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div><strong>Evidence Photos:</strong> {photos.length > 0 && `(${photos.length})`}</div>
        <Button 
          variant="outline-primary" 
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : '+ Add Photos'}
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
import React, { useRef, useState } from 'react';
import { Button, Modal, Alert } from 'react-bootstrap';
import { supabase } from '../../services/supabase';
import './styles.css'; // This will be created in the next step

const PhotoUploader = ({ photos = [], onChange }) => {
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    setError(null);
    
    try {
      const newPhotos = [];
      
      for (const file of files) {
        try {
          // Create simpler filenames
          const timestamp = new Date().getTime();
          const randomStr = Math.random().toString(36).substring(2, 10);
          const filename = `${timestamp}_${randomStr}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          
          console.log(`Uploading ${filename} to Supabase...`);
          
          // Upload with simpler options
          const { data, error: uploadError } = await supabase.storage
            .from('puwer')
            .upload(`photos/${filename}`, file, {
              upsert: true // Changed to true to overwrite if exists
            });
            
          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
          }
          
          // Get URL with simpler approach
          const { data: urlData } = supabase.storage
            .from('puwer')
            .getPublicUrl(`photos/${filename}`);
            
          if (!urlData || !urlData.publicUrl) {
            throw new Error('Could not get public URL');
          }
          
          console.log('Successfully uploaded, URL:', urlData.publicUrl);
          
          // Add to our new photos
          newPhotos.push({
            id: `photo_${timestamp}_${randomStr}`,
            url: urlData.publicUrl,
            name: file.name,
            type: file.type,
            size: file.size,
            timestamp: new Date().toISOString()
          });
        } catch (err) {
          console.error('Error with file:', file.name, err);
          setError(`Error uploading ${file.name}: ${err.message || 'Unknown error'}`);
        }
      }
      
      if (newPhotos.length > 0) {
        console.log(`Successfully uploaded ${newPhotos.length} photos`);
        onChange([...photos, ...newPhotos]);
      } else {
        setError('No files were uploaded successfully. Check browser console for details.');
      }
    } catch (e) {
      console.error('Overall upload error:', e);
      setError('Error during upload: ' + (e.message || 'Unknown error'));
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
            <div key={photo.id} className="photo-item">
              <img 
                src={photo.url} 
                alt="Evidence" 
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
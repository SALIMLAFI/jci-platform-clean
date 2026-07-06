'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  required?: boolean;
}

export function ImageUpload({ value, onChange, label = 'Preuve', required = false }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(value || '');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/)) {
      setError('Veuillez sélectionner une image (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image ne doit pas dépasser 5MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'jci_expenses'); // You'll need to configure this in Cloudinary

      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      const imageUrl = data.secure_url;
      setPreview(imageUrl);
      onChange(imageUrl);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'upload de l\'image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      
      <div
        className="relative"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-xl border-2 border-border"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-destructive/90 hover:bg-destructive text-white rounded-lg shadow-lg transition-colors"
              type="button"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        ) : (
          <motion.div
            whileHover={{ borderColor: 'var(--primary)' }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:bg-secondary/50 transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-4">
              {uploading ? (
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              ) : (
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
              )}
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {uploading ? 'Upload en cours...' : 'Cliquez ou glissez-déposez une image'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPEG, PNG, GIF, WebP (max 5MB)
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}

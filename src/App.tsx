import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import { Image as ImageIcon, File as FilePdf, Download, Loader2 } from 'lucide-react';

// Define TypeScript interface for images with preview URLs
interface ImageFile extends File {
  preview: string;
}

const App: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPdfDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && acceptedFiles[0].type === 'application/pdf') {
      setPdfFile(acceptedFiles[0]);
      setError(null);
    } else {
      setError('Please upload a valid PDF file');
    }
  }, []);

  const onImagesDrop = useCallback((acceptedFiles: File[]) => {
    const imageFiles: ImageFile[] = acceptedFiles
      .filter(file => file.type.startsWith('image/'))
      .map(file => Object.assign(file, { preview: URL.createObjectURL(file) }));

    setImages(prevImages => [...prevImages, ...imageFiles]);
    setError(null);
  }, []);

  const { getRootProps: getPdfRootProps, getInputProps: getPdfInputProps } = useDropzone({
    onDrop: onPdfDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  });

  const { getRootProps: getImagesRootProps, getInputProps: getImagesInputProps } = useDropzone({
    onDrop: onImagesDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    multiple: true
  });

  const handleMergePdf = async () => {
    if (!pdfFile || images.length === 0) {
      setError('Please upload both a PDF and at least one image');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const pdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);

      for (const imageFile of images) {
        const imageBytes = await imageFile.arrayBuffer();
        let image;

        if (imageFile.type === 'image/jpeg') {
          image = await pdfDoc.embedJpg(imageBytes);
        } else if (imageFile.type === 'image/png') {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          continue;
        }

        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const scaledDims = image.scale(0.8);

        page.drawImage(image, {
          x: (width - scaledDims.width) / 2,
          y: (height - scaledDims.height) / 2,
          width: scaledDims.width,
          height: scaledDims.height,
        });
      }

      const mergedPdfBytes = await pdfDoc.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'merged-document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      setError('Error processing PDF. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => images.forEach(image => URL.revokeObjectURL(image.preview));
  }, [images]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">PDF Image Merger</h1>
          <p className="text-lg text-gray-600">Upload a PDF and add images as new pages</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 mb-8">
          {/* PDF Upload */}
          <div {...getPdfRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${pdfFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-gray-400'}`}>
            <input {...getPdfInputProps()} />
            <FilePdf className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-600">{pdfFile ? <span className="text-green-600">{pdfFile.name}</span> : 'Drag & drop your PDF here, or click to select'}</p>
          </div>

          {/* Image Upload */}
          <div {...getImagesRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${images.length > 0 ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
            <input {...getImagesInputProps()} />
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-600">{images.length > 0 ? <span className="text-blue-600">{images.length} images selected</span> : 'Drag & drop images here, or click to select'}</p>
          </div>
        </div>

        {/* Image Previews */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {images.map((file, index) => (
              <div key={index} className="relative rounded-lg overflow-hidden h-24">
                <img src={file.preview} alt={`preview ${index + 1}`} className="w-full h-full object-cover" />
                <button onClick={(e) => { e.stopPropagation(); setImages(images.filter((_, i) => i !== index)); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                  ✖
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-600 text-sm">{error}</p></div>}

        <button onClick={handleMergePdf} disabled={loading || !pdfFile || images.length === 0} className={`w-full px-8 py-3 text-white rounded-md ${loading || !pdfFile || images.length === 0 ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
          {loading ? <><Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" /> Processing...</> : <><Download className="-ml-1 mr-3 h-5 w-5" /> Merge and Download</>}
        </button>
      </div>
    </div>
  );
};

export default App;

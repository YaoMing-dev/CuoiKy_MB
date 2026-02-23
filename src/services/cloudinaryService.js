const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const uploadImage = async (imageUri, folder = 'exploreease') => {
  const formData = new FormData();

  const filename = imageUri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', { uri: imageUri, name: filename, type });
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const data = await response.json();
  return data.secure_url;
};

export const uploadMultipleImages = async (imageUris, folder = 'exploreease') => {
  const urls = await Promise.all(imageUris.map((uri) => uploadImage(uri, folder)));
  return urls;
};

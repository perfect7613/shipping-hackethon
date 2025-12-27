import { createClient } from './client'

const COMIC_IMAGES_BUCKET = 'comic-images'
const COMIC_AUDIO_BUCKET = 'comic-audio'

/**
 * Upload an image to Supabase Storage
 * @param file - The image file or base64 data
 * @param path - The storage path (e.g., 'user_123/comic_456/panel_1.png')
 * @returns The public URL of the uploaded image
 */
export async function uploadImage(
    file: File | Blob | ArrayBuffer,
    path: string
): Promise<{ url: string | null; error: string | null }> {
    const supabase = createClient()

    const { data, error } = await supabase.storage
        .from(COMIC_IMAGES_BUCKET)
        .upload(path, file, {
            contentType: 'image/png',
            upsert: true,
        })

    if (error) {
        console.error('Error uploading image:', error)
        return { url: null, error: error.message }
    }

    const { data: publicUrl } = supabase.storage
        .from(COMIC_IMAGES_BUCKET)
        .getPublicUrl(data.path)

    return { url: publicUrl.publicUrl, error: null }
}

/**
 * Upload an audio file to Supabase Storage
 * @param file - The audio file or base64 data
 * @param path - The storage path (e.g., 'user_123/comic_456/panel_1.wav')
 * @returns The public URL of the uploaded audio
 */
export async function uploadAudio(
    file: File | Blob | ArrayBuffer,
    path: string
): Promise<{ url: string | null; error: string | null }> {
    const supabase = createClient()

    const { data, error } = await supabase.storage
        .from(COMIC_AUDIO_BUCKET)
        .upload(path, file, {
            contentType: 'audio/wav',
            upsert: true,
        })

    if (error) {
        console.error('Error uploading audio:', error)
        return { url: null, error: error.message }
    }

    const { data: publicUrl } = supabase.storage
        .from(COMIC_AUDIO_BUCKET)
        .getPublicUrl(data.path)

    return { url: publicUrl.publicUrl, error: null }
}

/**
 * Upload image from URL to Supabase Storage
 * @param imageUrl - The source URL of the image
 * @param path - The storage path
 * @returns The public URL of the uploaded image
 */
export async function uploadImageFromUrl(
    imageUrl: string,
    path: string
): Promise<{ url: string | null; error: string | null }> {
    try {
        const response = await fetch(imageUrl)
        if (!response.ok) {
            return { url: null, error: 'Failed to fetch image from URL' }
        }

        const blob = await response.blob()
        return uploadImage(blob, path)
    } catch (err) {
        console.error('Error fetching image from URL:', err)
        return { url: null, error: 'Failed to download image' }
    }
}

/**
 * Upload audio from base64 to Supabase Storage
 * @param base64Data - The base64 encoded audio data
 * @param path - The storage path
 * @returns The public URL of the uploaded audio
 */
export async function uploadAudioFromBase64(
    base64Data: string,
    path: string
): Promise<{ url: string | null; error: string | null }> {
    try {
        // Remove data URL prefix if present
        const base64Content = base64Data.replace(/^data:audio\/\w+;base64,/, '')

        // Convert base64 to ArrayBuffer
        const binaryString = atob(base64Content)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
        }

        return uploadAudio(bytes.buffer, path)
    } catch (err) {
        console.error('Error converting base64 audio:', err)
        return { url: null, error: 'Failed to process audio data' }
    }
}

/**
 * Get public URL for a file in storage
 * @param bucket - The storage bucket name
 * @param path - The file path
 * @returns The public URL
 */
export function getPublicUrl(bucket: string, path: string): string {
    const supabase = createClient()
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
}

/**
 * Delete a file from storage
 * @param bucket - The storage bucket name
 * @param paths - Array of file paths to delete
 */
export async function deleteFiles(
    bucket: string,
    paths: string[]
): Promise<{ error: string | null }> {
    const supabase = createClient()
    const { error } = await supabase.storage.from(bucket).remove(paths)

    if (error) {
        console.error('Error deleting files:', error)
        return { error: error.message }
    }

    return { error: null }
}

/**
 * List files in a storage folder
 * @param bucket - The storage bucket name
 * @param folder - The folder path
 */
export async function listFiles(
    bucket: string,
    folder: string
): Promise<{ files: string[]; error: string | null }> {
    const supabase = createClient()
    const { data, error } = await supabase.storage.from(bucket).list(folder)

    if (error) {
        console.error('Error listing files:', error)
        return { files: [], error: error.message }
    }

    return {
        files: data.map(file => `${folder}/${file.name}`),
        error: null
    }
}

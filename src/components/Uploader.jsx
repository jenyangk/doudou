'use client';

import React, { useState, useEffect } from 'react';
import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import Compressor from '@uppy/compressor';
import Webcam from '@uppy/webcam';
import { Dashboard } from '@uppy/react';
import heic2any from 'heic2any';

import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import '@uppy/webcam/dist/style.min.css';

// import { supabase } from '@/lib/supabase'; // Supabase import removed
import { toast } from 'sonner'; // Import toast for user feedback

const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Will be unused or replaced
const NEXT_PUBLIC_SUPABASE_PROJECT_ID = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID; // Will be unused or replaced
const NEXT_PUBLIC_STORAGE_BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET; // Will be unused or replaced

// const supabaseStorageURL = `https://${NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/upload/resumable`; // Supabase specific URL

export default function Uploader({ sessionId }) {
    const [uppy] = useState(() => {
        const uppyInstance = new Uppy({
            autoProceed: false,
            restrictions: {
                allowedFileTypes: ['image/*'],
            },
            meta: { type: 'image' },
        });

        // Commenting out Tus configuration for Supabase Storage
        // uppyInstance.use(Tus, {
        //     endpoint: supabaseStorageURL, // This would need to be replaced with a new backend endpoint
        //     headers: {
        //         apikey: NEXT_PUBLIC_SUPABASE_ANON_KEY, // Auth would change
        //     },
        //     uploadDataDuringCreation: true,
        //     chunkSize: 6 * 1024 * 1024,
        //     allowedMetaFields: ['bucketName', 'objectName', 'contentType', 'cacheControl'],
        //     onError: function (error) {
        //         console.error('Failed because: ' + error);
        //         toast.error('Upload failed: ' + error);
        //     },
        // });
        
        uppyInstance.use(Compressor, { quality: 0.9 });
        uppyInstance.use(Webcam);
        return uppyInstance;
    });

    // useEffect for setting Supabase auth header - COMMENTING OUT
    // useEffect(() => {
    //     const setAuthHeader = async () => {
    //         // const session = await supabase.auth.getSession();
    //         // const accessToken = session.data.session?.access_token;
    //         // if (accessToken) {
    //         //     uppy.getPlugin('Tus').setOptions({
    //         //         headers: {
    //         //             authorization: `Bearer ${accessToken}`,
    //         //             apikey: NEXT_PUBLIC_SUPABASE_ANON_KEY,
    //         //         },
    //         //     });
    //         // }
    //         toast.info("Uploader auth setup for Supabase is disabled.");
    //     };
    //     // setAuthHeader(); // Call commented out
    // }, [uppy]);

    uppy.off('file-added', null).on('file-added', async (file) => {
        // Convert HEIC to JPEG if necessary (this logic can stay)
        if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
            const jpegBlob = await heic2any({
                blob: file.data,
                toType: 'image/jpeg',
                quality: 1.0,
            });

            // Create a new file with converted data
            const convertedFile = await uppy.addFile({
                name: file.name.replace(/\.(heic|HEIC|heif|HEIF)$/, '.jpg'),
                type: 'image/jpeg',
                data: jpegBlob,
                source: file.source,
                isRemote: false,
            });

            // Remove the original HEIC file
            uppy.removeFile(file.id);
            file = convertedFile;
        }

        // Supabase specific metadata setting - COMMENTING OUT / MODIFYING
        // const supabaseMetadata = {
        //     bucketName: NEXT_PUBLIC_STORAGE_BUCKET,
        //     objectName: `${sessionId}/${file.name}`, // This path generation might be useful for a new backend
        //     contentType: file.type,
        // };
        // file.meta = {
        //     ...file.meta,
        //     ...supabaseMetadata,
        // };
        
        // For now, just ensure file.meta exists if other parts of Uppy expect it.
        file.meta = {
            ...file.meta,
            objectName: `${sessionId}/${file.name}`, // Keep objectName for potential future use
            contentType: file.type,
        };
        console.log("File added with meta:", file.meta);
        toast.info(`File ${file.name} ready for upload. Target: ${file.meta.objectName}`);
    });

    // on('complete') handler for Supabase database insertion - COMMENTING OUT
    uppy.off('complete', null).on('complete', async (result) => {
        // try {
        //     const promises = result.successful.map(async (file) => {
        //         // const imageUrl = `https://${NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/${NEXT_PUBLIC_STORAGE_BUCKET}/${file.meta.objectName}`;
        //         // const { error } = await supabase.from('session_images').insert({
        //         //     sessionId: sessionId,
        //         //     url: imageUrl,
        //         //     userId: (await supabase.auth.getUser()).data.user.id, // This auth call would also fail
        //         // });
        //         // if (error) throw error;
        //         toast.success(`File ${file.name} uploaded (DB insert disabled).`);
        //     });
        //     // await Promise.all(promises);
        // } catch (error) {
        //     console.error('Error adding to session_images (disabled):', error);
        //     toast.error('Error processing uploaded file (DB insert disabled).');
        // }
        if (result.successful.length > 0) {
            toast.success(`${result.successful.length} file(s) uploaded successfully (backend processing disabled).`);
        }
        if (result.failed.length > 0) {
            toast.error(`${result.failed.length} file(s) failed to upload.`);
        }
        console.log('Upload complete. Successful:', result.successful);
        console.log('Upload complete. Failed:', result.failed);
    });

    // Inform user that Tus (actual upload transport) is disabled
    uppy.on('dashboard:modal-open', () => {
        if (!uppy.getPlugin('Tus')) {
            toast.warning("File uploads are currently disabled as the upload transport (Tus) is not configured.", { duration: 10000 });
        }
    });
    
    return <Dashboard uppy={uppy} height={200} showProgressDetails={true} fileManagerSelectionType='files' />;
}

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

import { supabase } from '@/lib/supabase';

const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const NEXT_PUBLIC_SUPABASE_PROJECT_ID = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
const NEXT_PUBLIC_STORAGE_BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET;

const supabaseStorageURL = `https://${NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/upload/resumable`;

export default function Uploader({ sessionId }) {
    const [uppy] = useState(() =>
        new Uppy({
            autoProceed: false,
            restrictions: {
                allowedFileTypes: ['image/*'],
            },
            meta: { type: 'image' },
        })
            .use(Tus, {
                endpoint: supabaseStorageURL,
                headers: {
                    apikey: NEXT_PUBLIC_SUPABASE_ANON_KEY,
                },
                uploadDataDuringCreation: true,
                chunkSize: 6 * 1024 * 1024,
                allowedMetaFields: ['bucketName', 'objectName', 'contentType', 'cacheControl'],
                onError: function (error) {
                    console.error('Failed because: ' + error);
                },
            })
            .use(Compressor, { quality: 0.9 })
            .use(Webcam)
    );

    useEffect(() => {
        const setAuthHeader = async () => {
            const session = await supabase.auth.getSession();
            const accessToken = session.data.session?.access_token;

            if (accessToken) {
                uppy.getPlugin('Tus').setOptions({
                    headers: {
                        authorization: `Bearer ${accessToken}`,
                        apikey: NEXT_PUBLIC_SUPABASE_ANON_KEY,
                    },
                });
            }
        };

        setAuthHeader();
    }, [uppy]);

    uppy.off('file-added', null).on('file-added', async (file) => {
        // Convert HEIC to JPEG if necessary
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

        const supabaseMetadata = {
            bucketName: NEXT_PUBLIC_STORAGE_BUCKET,
            objectName: `${sessionId}/${file.name}`,
            contentType: file.type,
        };

        file.meta = {
            ...file.meta,
            ...supabaseMetadata,
        };
    });

    uppy.off('complete', null).on('complete', async (result) => {
        try {
            const promises = result.successful.map(async (file) => {
                const imageUrl = `https://${NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/${NEXT_PUBLIC_STORAGE_BUCKET}/${file.meta.objectName}`;

                const { error } = await supabase.from('session_images').insert({
                    sessionId: sessionId,
                    url: imageUrl,
                    userId: (await supabase.auth.getUser()).data.user.id,
                });

                if (error) throw error;
            });

            await Promise.all(promises);
        } catch (error) {
            console.error('Error adding to session_images:', error);
        }
    });

    return <Dashboard uppy={uppy} height={200} showProgressDetails={true} fileManagerSelectionType='files' />;
}

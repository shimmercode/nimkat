'use client';
import {useEffect} from 'react';
export default function ServiceWorker(){useEffect(()=>{if(process.env.NODE_ENV==='production'&&'serviceWorker' in navigator&&window.isSecureContext)navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).catch(()=>{/* Offline support must never prevent login. */});},[]);return null;}

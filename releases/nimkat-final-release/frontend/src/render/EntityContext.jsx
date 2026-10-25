'use client';
import { createContext, useContext } from 'react';
const EntityContext = createContext(null);
export const EntityProvider = EntityContext.Provider;
export const useInitialEntity = () => useContext(EntityContext);

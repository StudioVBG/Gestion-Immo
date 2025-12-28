-- =====================================================
-- Migration: Ajouter colonnes manquantes dans profiles
-- Date: 2024-12-22
-- =====================================================
-- Colonnes nécessaires pour le flux de signature locataire
-- =====================================================

BEGIN;

-- 1. Ajouter lieu_naissance si manquant
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'lieu_naissance'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN lieu_naissance VARCHAR(255);
        
        COMMENT ON COLUMN profiles.lieu_naissance IS 
            'Lieu de naissance pour les documents officiels';
    END IF;
END $$;

-- 2. Ajouter adresse si manquant
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'adresse'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN adresse TEXT;
        
        COMMENT ON COLUMN profiles.adresse IS 
            'Adresse complète du profil';
    END IF;
END $$;

-- 3. Ajouter nationalite si manquant
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'nationalite'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN nationalite VARCHAR(100) DEFAULT 'Française';
        
        COMMENT ON COLUMN profiles.nationalite IS 
            'Nationalité du profil';
    END IF;
END $$;

COMMIT;







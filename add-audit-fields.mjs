#!/usr/bin/env node

import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function addAuditFields() {
  try {
    await client.connect();
    console.log('🔗 Conectado ao banco de dados');
    
    // Verificar se as colunas já existem
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'AuditLog' 
      AND column_name IN ('hash', 'prevHash', 'hmac')
    `;
    
    const existingColumns = await client.query(checkQuery);
    console.log('📋 Colunas existentes:', existingColumns.rows.map(r => r.column_name));
    
    // Adicionar colunas se não existirem
    const addHashQuery = `ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "hash" text;`;
    const addPrevHashQuery = `ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "prevHash" text;`;
    const addHmacQuery = `ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "hmac" text;`;
    
    if (!existingColumns.rows.find(r => r.column_name === 'hash')) {
      await client.query(addHashQuery);
      console.log('✅ Adicionada coluna hash');
    }
    
    if (!existingColumns.rows.find(r => r.column_name === 'prevHash')) {
      await client.query(addPrevHashQuery);
      console.log('✅ Adicionada coluna prevHash');
    }
    
    if (!existingColumns.rows.find(r => r.column_name === 'hmac')) {
      await client.query(addHmacQuery);
      console.log('✅ Adicionada coluna hmac');
    }
    
    console.log('🎉 Campos de auditoria adicionados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

addAuditFields();

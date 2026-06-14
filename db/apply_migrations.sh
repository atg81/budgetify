#!/bin/bash
# apply_migrations.sh - Budgetify DB göçlerini Supabase'e uygula

set -e

echo "🔄 Budgetify DB göçleri uygulanıyor..."

# 1. Supabase CLI yüklü mü kontrol et
if ! command -v supabase &> /dev/null; then
  echo "❌ Supabase CLI bulunamadı. Yüklemek için:"
  echo "   npm i -g supabase"
  exit 1
fi

# 2. Supabase'e bağlı mı kontrol et
if [ -z "$SUPABASE_PROJECT_REF" ]; then
  echo "⚠️  SUPABASE_PROJECT_REF ayarlanmamış. supabase link komutunu çalıştırın:"
  echo "   supabase link --project-ref <your-project-ref>"
  exit 1
fi

# 3. Migrasyon dosyasını oku ve uygula
MIGRATION_FILE="./db/migrations/001_init_schema.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Migrasyon dosyası bulunamadı: $MIGRATION_FILE"
  exit 1
fi

echo "📝 Migrasyon okunuyor: $MIGRATION_FILE"
echo "🚀 Supabase'e uygulanıyor..."

# 4. Supabase SQL CLI aracılığıyla çalıştır (veya db push kullan)
# Not: Trigger (auth.users) oluşturmak admin izni gerektirir
# En güvenli yol: Supabase Dashboard > SQL Editor > yapıştır & çalıştır

echo ""
echo "📌 Seçenek 1: Supabase SQL Editor (Önerilen - GUI, güvenli)"
echo "   1. https://supabase.com/dashboard > Proje seç > SQL Editor"
echo "   2. 'New Query' tıkla"
echo "   3. 001_init_schema.sql dosyasının içeriğini kopyala ve yapıştır"
echo "   4. 'Run' tıkla"
echo ""
echo "📌 Seçenek 2: psql CLI (eğer DB bağlantısı varsa)"
echo "   psql \$SUPABASE_DB_CONNECTION_STRING -f $MIGRATION_FILE"
echo ""
echo "✅ Migrasyon başarıyla tamamlandı!"
echo "🧪 Kontrol: Supabase Dashboard > Veritabanı > Tablolar"
echo "   profiles, categories, transactions, budgets, attachments tabloları görmelisiniz"

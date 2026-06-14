#!/bin/bash
# migrate_db.sh - Supabase'den Neon'a veri göçü
#
# Kullanım:
#   1. Değişkenleri doldurun (SUPABASE_URL ve NEON_URL)
#   2. chmod +x migrate_db.sh
#   3. ./migrate_db.sh
#
# Gereksinimler: pg_dump, psql

set -e

echo "🚀 Supabase → Neon Veri Göçü Başlıyor..."
echo ""

# =====================================================
# BAĞLANTI BİLGİLERİNİ BURAYA GİRİN
# =====================================================

# Supabase bağlantı stringi
# Format: postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL="${SUPABASE_URL:-}"

# Neon bağlantı stringi  
# Format: postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require
NEON_URL="${NEON_URL:-}"

# =====================================================
# DOĞRULAMA
# =====================================================

if [ -z "$SUPABASE_URL" ]; then
  echo "❌ SUPABASE_URL tanımlı değil!"
  echo "   Örnek: export SUPABASE_URL='postgresql://postgres:password@db.xxx.supabase.co:5432/postgres'"
  exit 1
fi

if [ -z "$NEON_URL" ]; then
  echo "❌ NEON_URL tanımlı değil!"
  echo "   Örnek: export NEON_URL='postgresql://user:pass@host.neon.tech/neondb?sslmode=require'"
  exit 1
fi

# =====================================================
# BACKUP KLASÖRÜ
# =====================================================

BACKUP_DIR="./db/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/supabase_backup_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

# =====================================================
# ADIM 1: SUPABASE'DEN VERİ EXPORT
# =====================================================

echo "📤 Supabase'den veriler dışa aktarılıyor..."
echo "   Tablo: users, categories, transactions, budgets, attachments"
echo ""

# Sadece belirli tabloları export et (auth.users hariç, kendi users tablomuz var)
pg_dump "$SUPABASE_URL" \
  --data-only \
  --no-owner \
  --no-privileges \
  --table=public.profiles \
  --table=public.categories \
  --table=public.transactions \
  --table=public.budgets \
  --table=public.attachments \
  > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Backup oluşturuldu: $BACKUP_FILE"
  echo "   Boyut: $(du -h "$BACKUP_FILE" | cut -f1)"
else
  echo "❌ pg_dump başarısız!"
  exit 1
fi

# =====================================================
# ADIM 2: NEON'A ŞEMA UYGULA
# =====================================================

echo ""
echo "📝 Neon'a şema uygulanıyor..."

SCHEMA_FILE="./db/migrations/002_neon_schema.sql"

if [ -f "$SCHEMA_FILE" ]; then
  psql "$NEON_URL" -f "$SCHEMA_FILE"
  if [ $? -eq 0 ]; then
    echo "✅ Şema başarıyla uygulandı"
  else
    echo "❌ Şema uygulanamadı!"
    exit 1
  fi
else
  echo "⚠️  Şema dosyası bulunamadı: $SCHEMA_FILE"
  echo "   Lütfen önce 002_neon_schema.sql dosyasını oluşturun"
fi

# =====================================================
# ADIM 3: NEON'A VERİ IMPORT
# =====================================================

echo ""
echo "📥 Neon'a veriler aktarılıyor..."

# profiles -> users dönüşümü gerekebilir
# Şimdilik doğrudan import
psql "$NEON_URL" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Veriler başarıyla aktarıldı!"
else
  echo "❌ Veri aktarımı başarısız!"
  exit 1
fi

# =====================================================
# ADIM 4: DOĞRULAMA
# =====================================================

echo ""
echo "🔍 Tablo satır sayıları kontrol ediliyor..."
echo ""

psql "$NEON_URL" -c "
SELECT 
  'users' as tablo, COUNT(*) as satir FROM users
UNION ALL SELECT 
  'categories', COUNT(*) FROM categories
UNION ALL SELECT 
  'transactions', COUNT(*) FROM transactions
UNION ALL SELECT 
  'budgets', COUNT(*) FROM budgets
UNION ALL SELECT 
  'attachments', COUNT(*) FROM attachments;
"

# =====================================================
# TAMAMLANDI
# =====================================================

echo ""
echo "🎉 Göç tamamlandı!"
echo ""
echo "📌 Sonraki adımlar:"
echo "   1. .env.local dosyasında VITE_DATABASE_URL'i Neon bağlantı stringi ile güncelleyin"
echo "   2. npm run dev ile uygulamayı başlatın"
echo "   3. Giriş yaparak verilerin doğru aktarıldığını kontrol edin"
echo ""

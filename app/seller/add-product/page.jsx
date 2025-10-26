// app/seller/add-product/page.jsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FiX, FiUploadCloud, FiMove } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import FloatingLabelInput from '@/components/ui/FloatingLabelInput';
import Loading from '@/components/Loading'; // Loading component'ını import et

const BUCKET_NAME = 'product-images';
// BÜTÜN LİMİTLER 100 OLARAK GÜNCELLENDİ
const LIMITS = { 
  bigcard: 100, 
  doublebigcardtext: 100, 
  icons: 100, 
  brandicon: 100, 
  homepage_carousel: 100 
};

export default function AddProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]); // Mevcut ürünleri limit kontrolü için tutuyoruz
  const [actionLoading, setActionLoading] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState([]); // { file: File, preview: string }[]

  // Drag işlemleri için ref'ler (Yüklenecek görseller için)
  const dragItemNode = useRef(); // Sürüklenen DOM öğesi
  const draggedIndex = useRef(null); // Başlangıç index'i
  const dragOverIndex = useRef(null); // Üzerine gelinen index

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    stock: '',
    // ⭐ YENİ ALANLAR - 11'li pakete kadar güncellendi ⭐
    price_2_pack: '',
    price_3_pack: '',
    price_4_pack: '',
    price_5_pack: '', // YENİ
    price_6_pack: '', // YENİ
    price_7_pack: '', // YENİ
    price_8_pack: '', // YENİ
    price_9_pack: '', // YENİ
    price_10_pack: '', // YENİ
    price_11_pack: '', // YENİ
    // ⭐ SONU ⭐
    bigcard: false,
    doublebigcardtext: false,
    icons: false,
    brandicon: false,
    homepage_carousel: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      // Kategorileri çek
      const { data: categoriesData, error: categoriesError } = await supabase.from('categories').select('id, name');
      if (categoriesError) toast.error('Kategoriler alınamadı.');
      else setCategories(categoriesData || []); // Null ise boş dizi ata

      // Mevcut ürünlerin vitrin bilgilerini çek (Limit kontrolü için)
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, bigcard, doublebigcardtext, icons, brandicon, homepage_carousel');
      if (productsError) toast.error('Mevcut ürünler kontrol edilemedi.');
      else setProducts(productsData || []); // Null ise boş dizi ata
    };
    fetchData();
  }, []);

  // Dosya seçildiğinde
  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setFilesToUpload(prev => [...prev, ...newFiles]);
      e.target.value = null; // Input'u sıfırla ki aynı dosya tekrar seçilebilsin
    }
  };

  // Yüklenecek önizlemeyi kaldır
  const handleRemoveNewImage = (filePreviewUrl) => {
    setFilesToUpload(prev => {
        const fileToRemove = prev.find(f => f.preview === filePreviewUrl);
        if (fileToRemove) {
            URL.revokeObjectURL(fileToRemove.preview); // Memory leak önlemek için URL'i serbest bırak
        }
        return prev.filter(f => f.preview !== filePreviewUrl);
    });
  };

  // Form alanları değiştiğinde
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      const limit = LIMITS[name];
      if (limit !== undefined && checked) {
        // Mevcut ürünlerde bu özelliğe sahip kaç tane var?
        const count = products.filter(p => p[name]).length;
        if (count >= limit) {
          toast.error(`Maksimum ${limit} adet "${name}" ürünü seçebilirsiniz!`);
          e.target.checked = false; // Checkbox'ı geri al
          return; // State'i güncelleme
        }
      }
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

    // === Drag & Drop Event Handlers (Yüklenecek Görseller İçin) ===
  const handleAddDragStart = (e, index) => {
    draggedIndex.current = index;
    dragItemNode.current = e.target.closest('[draggable="true"]');
  };

  const handleAddDragEnter = (e, index) => {
      const dropZone = e.target.closest('[draggable="true"]');
      if (dragItemNode.current !== dropZone && draggedIndex.current !== index) {
        dragOverIndex.current = index;

        const reorderedFiles = [...filesToUpload];
        const [movedItem] = reorderedFiles.splice(draggedIndex.current, 1);
        reorderedFiles.splice(index, 0, movedItem);

        setFilesToUpload(reorderedFiles); // State'i güncelle

        draggedIndex.current = index; // Sürüklenen index'i güncelle
      }
  };

  const handleAddDragEnd = () => {
    // Sıralama zaten state'e yansıdı, ref'leri temizle
    dragItemNode.current = null;
    draggedIndex.current = null;
    dragOverIndex.current = null;
    // Burada DB güncellemesi yok, sadece state güncellendi
  };

  const handleAddDragOver = (e) => {
    e.preventDefault(); // Drop işlemine izin ver
  };

    // === Touch Event Handlers (Yüklenecek Görseller İçin) ===
    const handleAddTouchStart = (e, index) => {
        draggedIndex.current = index;
        dragItemNode.current = e.target.closest('[draggable="true"]');
    };

    const handleAddTouchMove = (e) => {
        if (draggedIndex.current === null || !dragItemNode.current) return;
        e.preventDefault(); // Sayfa kaymasını engelle

        const touchLocation = e.touches[0];
        const elementOver = document.elementFromPoint(touchLocation.clientX, touchLocation.clientY);
        const dropZone = elementOver?.closest('[draggable="true"]');

        // Sadece yükleme alanındaki draggable elemanları dikkate al
        if (dropZone && dropZone.closest('.upload-preview-container')?.contains(dropZone)) {
            const overIndexAttr = dropZone.getAttribute('data-index');
            if (overIndexAttr !== null) {
                const overIndex = parseInt(overIndexAttr, 10);
                if (overIndex !== draggedIndex.current) {
                    dragOverIndex.current = overIndex;

                    const reorderedFiles = [...filesToUpload];
                    const [movedItem] = reorderedFiles.splice(draggedIndex.current, 1);
                    reorderedFiles.splice(overIndex, 0, movedItem);

                    setFilesToUpload(reorderedFiles); // State'i güncelle
                    draggedIndex.current = overIndex; // Sürüklenen index'i güncelle
                }
            }
        }
    };

    const handleAddTouchEnd = () => {
        handleAddDragEnd(); // Aynı ref temizleme mantığı
    };


  // Seçilen ve sıralanmış dosyaları yükle
  const uploadFiles = async () => {
    if (filesToUpload.length === 0) return [];

    const uploadPromises = filesToUpload.map(async (fileObj, index) => { // index'i de alalım belki lazım olur
      const file = fileObj.file;
      const safeName = formData.name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_') || 'new_product';
      // Sıralamayı dosya adına ekleyebiliriz (opsiyonel) - örn: 01_dosyaadi.jpg, 02_baska.png
      const orderPrefix = String(index + 1).padStart(2, '0');
      const filePath = `${safeName}/${Date.now()}_${orderPrefix}_${file.name.replace(/\s/g, '_')}`;

      try {
        const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file);
        if (error) throw error;
        const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);
        if (!publicUrlData.publicUrl) throw new Error('Public URL alınamadı');
        URL.revokeObjectURL(fileObj.preview); // Memory leak önlemek için URL'i serbest bırak
        return publicUrlData.publicUrl;
      } catch (error) {
        toast.error(`Dosya yüklenemedi: ${file.name} - ${error.message}`);
        return null; // Başarısız yüklemeler için null döndür
      }
    });

    const results = await Promise.all(uploadPromises);
    return results.filter(url => url !== null); // Sadece başarılı yüklenen URL'leri döndür
  };


  // Ürünü Ekle
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category_id || formData.price === '' || formData.stock === '') {
      return toast.error('Lütfen isim, kategori, fiyat ve stok alanlarını doldurun.');
    }
      if (filesToUpload.length === 0) {
      return toast.error('Lütfen en az bir görsel yükleyin.');
    }

    setActionLoading(true);
    const toastId = toast.loading('Ürün ekleniyor ve görseller yükleniyor...');

    // Sıralanmış dosyaları yükle
    const uploadedUrls = await uploadFiles();

      if (uploadedUrls.length !== filesToUpload.length) {
          toast.error('Bazı görseller yüklenemediği için ürün eklenemedi.', { id: toastId });
          setActionLoading(false);
          // Başarısız yüklemeler için önizlemeleri temizlememek iyi olabilir, kullanıcı tekrar deneyebilir.
          return;
      }

      // Eğer tüm yüklemeler başarılıysa ürünü ekle
    const { error: insertError } = await supabase
      .from('products')
      .insert([{
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        // ⭐ YENİ ALANLAR DAHİL EDİLDİ (2'den 11'e kadar) ⭐
        price_2_pack: parseFloat(formData.price_2_pack) || 0,
        price_3_pack: parseFloat(formData.price_3_pack) || 0,
        price_4_pack: parseFloat(formData.price_4_pack) || 0,
        price_5_pack: parseFloat(formData.price_5_pack) || 0, // YENİ
        price_6_pack: parseFloat(formData.price_6_pack) || 0, // YENİ
        price_7_pack: parseFloat(formData.price_7_pack) || 0, // YENİ
        price_8_pack: parseFloat(formData.price_8_pack) || 0, // YENİ
        price_9_pack: parseFloat(formData.price_9_pack) || 0, // YENİ
        price_10_pack: parseFloat(formData.price_10_pack) || 0, // YENİ
        price_11_pack: parseFloat(formData.price_11_pack) || 0, // YENİ
        // ⭐ SONU ⭐
        image_urls: uploadedUrls, // Yüklenen ve sıralanmış URL'ler
        bigcard: formData.bigcard,
        doublebigcardtext: formData.doublebigcardtext,
        icons: formData.icons,
        brandicon: formData.brandicon,
        homepage_carousel: formData.homepage_carousel
      }]);

    if (!insertError) {
      toast.success('Ürün başarıyla eklendi!', { id: toastId });
      setFilesToUpload([]); // Başarılı eklemeden sonra önizlemeleri temizle
      router.push('/seller/product-list'); // Ürün listesine yönlendir
    } else {
      toast.error('Veritabanına ekleme hatası: ' + insertError.message, { id: toastId });
      // Veritabanı hatası durumunda yüklenen görselleri silmeyi düşünebilirsin (opsiyonel ama önerilir)
        if (uploadedUrls.length > 0) {
            const filePathsToRemove = uploadedUrls.map(url => {
                try {
                    const urlParts = new URL(url);
                    // Supabase public URL yapısına göre path'i doğru ayıklama
                    // "/storage/v1/object/public/BUCKET_NAME/path/to/file.jpg"
                    return urlParts.pathname.split('/').slice(6).join('/');
                } catch { return null; }
            }).filter(path => path);
            if (filePathsToRemove.length > 0) {
              await supabase.storage.from(BUCKET_NAME).remove(filePathsToRemove);
              console.log("DB hatası nedeniyle yüklenen görseller Storage'dan silindi.");
            }
        }
    }
    setActionLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-900 border-b pb-4">Yeni Ürün Ekle</h1>
      <form onSubmit={handleAddProduct} className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-lg space-y-8">
        
        {/* Temel Bilgiler */}
        <div className="space-y-6">
          <h3 className="font-bold text-xl text-gray-700 border-b pb-2">Temel Ürün Bilgileri</h3>
          <FloatingLabelInput id="name" name="name" label="Ürün Adı" value={formData.name} onChange={handleFormChange} required />
          <FloatingLabelInput as="textarea" id="description" name="description" label="Açıklama" value={formData.description} onChange={handleFormChange} />
          <select name="category_id" value={formData.category_id} onChange={handleFormChange} required className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white focus:ring-indigo-500 focus:border-indigo-500 transition">
            <option value="" disabled>Kategori Seç</option>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FloatingLabelInput id="price" name="price" type="number" label="Fiyat (₺)" value={formData.price} onChange={handleFormChange} required step="0.01" />
            <FloatingLabelInput id="stock" name="stock" type="number" label="Stok Adedi" value={formData.stock} onChange={handleFormChange} required />
          </div>
        </div>


        {/* Kampanya Fiyatları */}
        {/* ⭐ 11'li pakete kadar güncellenen kısım ⭐ */}
        <div className="space-y-6 border border-indigo-200/50 bg-indigo-50/50 rounded-xl p-6 shadow-inner">
          <h3 className="font-bold text-xl text-indigo-700 border-b pb-2">Paket/Kampanya Fiyatları (Opsiyonel)</h3>
          {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(packSize => (
             <FloatingLabelInput
                key={packSize}
                id={`price_${packSize}_pack`}
                name={`price_${packSize}_pack`}
                type="number"
                label={`${packSize}'li Paket Fiyatı (₺)`}
                value={formData[`price_${packSize}_pack`]}
                onChange={handleFormChange}
                step="0.01"
              />
          ))}
        </div>
        {/* ⭐ SONU ⭐ */}

        {/* Görsel Yükleme ve Sıralama Alanı */}
        <div className="border border-indigo-200/50 bg-indigo-50/50 rounded-xl p-6 shadow-lg upload-preview-container"> {/* Container için class */}
          <h3 className="font-bold text-xl text-indigo-700 mb-4 border-b pb-2">Görsel Yükle & Sırala</h3>
          <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-indigo-300 rounded-lg cursor-pointer hover:bg-indigo-100/50 transition">
            <FiUploadCloud className="w-8 h-8 text-indigo-500" />
            <p className="text-sm text-indigo-600">Sürükle bırak veya tıkla (Çoklu seçim)</p>
          </label>
          <input id="file-upload" type="file" name="files" onChange={handleFileChange} multiple accept="image/*" className="hidden" />

          {filesToUpload.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-semibold mb-3 text-gray-700">Yüklenecekler ({filesToUpload.length} adet) - Sıralamak için sürükleyin/basılı tutun.</h4>
              <div className="flex flex-wrap gap-3">
                {filesToUpload.map((fileObj, index) => (
                  <div
                    key={fileObj.preview} // Preview URL'i key olarak kullanmak daha stabil olabilir
                    draggable
                    onDragStart={(e) => handleAddDragStart(e, index)}
                    onDragEnter={(e) => handleAddDragEnter(e, index)}
                    onDragEnd={handleAddDragEnd}
                    onDragOver={handleAddDragOver}
                    onTouchStart={(e) => handleAddTouchStart(e, index)}
                    onTouchMove={handleAddTouchMove}
                    onTouchEnd={handleAddTouchEnd}
                    data-index={index}
                    className="relative w-20 h-20 border-2 border-transparent hover:border-indigo-500 rounded-lg overflow-hidden shadow-md group cursor-move transition-all"
                    style={{ touchAction: 'none' }} // Mobil scroll engelleme
                  >
                    <Image
                      src={fileObj.preview}
                      alt={`Preview ${index}`}
                      fill
                      sizes="80px"
                      style={{ objectFit: "cover", pointerEvents: 'none' }} // pointerEvents none
                    />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                          <FiMove className="text-white w-5 h-5 opacity-0 group-hover:opacity-80 transition-opacity" />
                      </div>
                    <button
                      type="button" // Formu submit etmesin
                      onClick={(e) => { e.stopPropagation(); handleRemoveNewImage(fileObj.preview); }}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-700"
                      title="Kaldır"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                    {/* Sıra Numarası */}
                    <span className="absolute bottom-1 left-1 bg-indigo-600 bg-opacity-90 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Vitrin Ayarları */}
        <div className="border border-indigo-200/50 bg-indigo-50/50 rounded-xl p-6 shadow-inner">
          <h3 className="font-bold text-xl text-indigo-700 mb-4 border-b pb-2">Vitrin Ayarları (Limitler: {LIMITS.bigcard})</h3>
          <div className="grid grid-cols-2 gap-4 text-sm sm:text-base">
            {Object.entries(LIMITS).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-indigo-100/50 transition">
                <input
                    type="checkbox"
                    name={key}
                    checked={!!formData[key]} // Undefined ise false olsun
                    onChange={handleFormChange}
                    className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                <span className="capitalize text-gray-700">{key.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Ekle Butonu */}
        <div className="mt-8 flex justify-end gap-3">
          <button
            type="submit"
            disabled={actionLoading}
            className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {actionLoading ? <Loading className="text-white h-5 w-5" /> : 'Ürünü Ekle'}
          </button>
        </div>
      </form>
    </div>
  );
}
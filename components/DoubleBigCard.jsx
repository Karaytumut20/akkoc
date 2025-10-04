"use client";

export default function FeaturedCategories() {
  const featuredItems = [
    {
      title: "Silver Jewelry",
      image: "/assets/kolye.jpg", // Mevcut jpg dosyan
      alt: "Gümüş Zincir Bileklik",
    },
    {
      title: "Elsa Peretti",
      image: "/assets/kolye2.jpg", // Mevcut jpg dosyan
      alt: "Elsa Peretti Kolye ve Yüzük",
    },
  ];

  return (
    <section className="w-full bg-white py-12 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Grid Düzeni */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {featuredItems.map((item, index) => (
            <div key={index} className="text-center group cursor-pointer">
              
              {/* Görsel Alanı */}
              <div className="relative w-full aspect-[4/3] sm:aspect-[3/4] overflow-hidden rounded-2xl shadow-lg">
                <img
                  src={item.image}
                  alt={item.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </div>

              {/* Metin Alanı */}
              <div className="mt-6">
                {/* Başlık */}
                <h3 className="text-xl font-serif text-gray-900 mb-4 tracking-wide">
                  {item.title}
                </h3>

                {/* Buton/Link */}
                <a
                  href={`/shop/${item.title.toLowerCase().replace(/\s/g, '-')}`}
                  className="text-xs font-semibold tracking-widest uppercase text-gray-900 border-b border-gray-900 pb-1 hover:text-teal-600 hover:border-teal-600 transition duration-200"
                >
                  SHOP NOW
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

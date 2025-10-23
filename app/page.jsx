// app/page.jsx

'use client'
import React from "react";
import HomeProducts from "@/components/HomeProducts";
import NewsLetter from "@/components/NewsLetter";
import CategoryPicture from "@/components/CategoryPicture";
import Services from "@/components/Services";
import DoubleBigCard from "@/components/DoubleBigCard"; // Bu DoubleBigCard sanırım BigCard olmalıydı? Veya farklı bir component mi?
import DoubleBigCardText from "@/components/DoubleBigCardText";
import ShopNow from "@/components/ShopNow";
// VideoBar import'u artık LayoutContent içinde olduğu için kaldırılabilir.
import HomepageCarousel from "@/components/HomepageCarousel"; // Yeni bileşeni import et
import Footer from "@/components/Footer";

const Home = () => {
  return (
    <>
      {/* VideoBar artık LayoutContent içinde yönetiliyor */}
      {/* Anasayfa içeriği */}
      <div className="px-6 md:px-16 lg:px-32">

        <CategoryPicture/>
        <HomepageCarousel /> {/* Yeni Carousel'i buraya ekledik */}
        <HomeProducts />
        {/* DoubleBigCard yerine BigCard olabilir mi? Eğer farklıysa doğru adı kullan. */}
        {/* <DoubleBigCard/> */}
        <Services/>
        <ShopNow/>
        <DoubleBigCardText/>
        <NewsLetter />
        <Footer />

      </div>
       {/* Footer artık LayoutContent içinde */}
    </>
  );
};

export default Home;
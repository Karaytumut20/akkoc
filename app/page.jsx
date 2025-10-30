// app/page.jsx

'use client'
import React from "react";
import HomeProducts from "@/components/HomeProducts";
import NewsLetter from "@/components/NewsLetter";
import CategoryPicture from "@/components/CategoryPicture";
import Services from "@/components/Services";
// DoubleBigCard import'u kaldırıldı
import DoubleBigCardText from "@/components/DoubleBigCardText";
import ShopNow from "@/components/ShopNow";
import VideoBar from "@/components/VideoBar";
import Footer from "@/components/Footer";
import HomepageCarousel from "@/components/HomepageCarousel";
import HomeCarousel from "@/components/HomeCarousel";
import Bigcard from "@/components/Bigcard";

const Home = () => {
  return (
    // Navbar ve Footer buradan tamamen kaldırıldı!
    <>
      <div className="px-6 md:px-16 lg:px-32">
<HomeCarousel />
      <CategoryPicture/>
        <HomeProducts />
        {/* <DoubleBigCard/> Kullanımı kaldırıldı */}
                <Bigcard/>

        <Services/>
        <ShopNow/>
        <DoubleBigCardText/>
       {/*  <NewsLetter />*/}
                <Footer />
      </div>
    </>
  );
};

export default Home;
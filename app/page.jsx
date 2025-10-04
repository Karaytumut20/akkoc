'use client'
import React from "react";
import HeaderSlider from "@/components/HeaderSlider";
import HomeProducts from "@/components/HomeProducts";
import Banner from "@/components/Banner";
import NewsLetter from "@/components/NewsLetter";
import FeaturedProduct from "@/components/FeaturedProduct";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Categories from "@/components/Categories";
import Services from "@/components/Services";

const Home = () => {
  return (
    <>
      <Navbar/>
      <div className="px-6 md:px-16 lg:px-32">
        <HeaderSlider />

              <Categories/>

        <HomeProducts />
        <FeaturedProduct />
        <Banner />
        <NewsLetter />
              <Services/>

      </div>
      <Footer />
    </>
  );
};

export default Home;

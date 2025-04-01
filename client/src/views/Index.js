import React, { useRef, useEffect } from "react";
import DemoNavbar from "components/Navbars/DemoNavbar.js";
import SimpleFooter from "components/Footers/SimpleFooter.js";
import Hero from "./IndexSections/Hero.js";
import About from "./IndexSections/About.js";
import Carousel from "./IndexSections/Carousel.js";

function Index() {
  const mainRef = useRef(null);

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <>
      <DemoNavbar />
      <main ref={mainRef}>
        <Hero />
        <About />
        <Carousel />
      </main>
      <SimpleFooter />
    </>
  );
}

export default Index;

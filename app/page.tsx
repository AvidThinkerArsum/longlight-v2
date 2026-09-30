import { BookingProvider } from "@/components/Booking";
import { ConceptBanner, MobileBar, Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Dates } from "@/components/Dates";
import { Letters } from "@/components/Letters";
import { Grounds } from "@/components/Grounds";
import { SixDays } from "@/components/SixDays";
import { People } from "@/components/People";
import { Hold } from "@/components/Hold";
import { Footer } from "@/components/Footer";
import { Calibrate } from "@/components/Calibrate";
import { Motion } from "@/components/Motion";

export default function Home() {
  return (
    <Motion>
    <BookingProvider>
      <ConceptBanner />
      <Nav />
      <main>
        <Hero />
        <Dates />
        <Letters />
        <Grounds />
        <SixDays />
        <People />
        <Hold />
      </main>
      <Footer />
      <MobileBar />
      <Calibrate />
    </BookingProvider>
    </Motion>
  );
}

import FooterLayout from "./FooterLayout";

export default function AboutUs() {
  return (
    <FooterLayout
      title="About Vizhiyal"
      subtitle="Sri Lanka's trusted event vendor marketplace."
    >
      <div className="space-y-5 text-gray-600">
        <p>
          Vizhiyal is an event marketplace connecting customers
          with trusted vendors across Sri Lanka.
        </p>

        <p>
          Customers can search, compare and book photographers,
          decorators, caterers, venues and more.
        </p>

        <p>
          Our goal is to simplify event planning through a
          transparent and secure platform.
        </p>
      </div>
    </FooterLayout>
  );
}
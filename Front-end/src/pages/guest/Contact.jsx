import FooterLayout from "./FooterLayout";

export default function Contact() {
  return (
    <FooterLayout
      title="Contact Us"
      subtitle="We are happy to assist you."
    >
      <div className="space-y-4 text-gray-600">
        <p>Email: support@vizhiyal.com</p>
        <p>Phone: +94 77 123 4567</p>
        <p>Address: Colombo, Sri Lanka</p>
      </div>
    </FooterLayout>
  );
}
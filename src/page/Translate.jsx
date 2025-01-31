import { useEffect } from "react";

function Translate() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: "en", autoDisplay: false },
        "google_translate_element"
      );
    };
  }, []);

  return (
    <div>
      <p className=" text-blue-900 mt-4 mb-2 font-oswald">Change Language:</p>
      <div id="google_translate_element"></div>
    </div>
  );
}

export default Translate;

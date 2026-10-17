import { SVGProps } from "react";

type Kind = "balance" | "steps" | "orbit" | "door";

/** Original monochrome artwork, shared by the reflection and project cards. */
export default function Illustration({
  kind = "balance",
  ...props
}: SVGProps<SVGSVGElement> & { kind?: Kind }) {
  return (
    <svg viewBox="0 0 220 150" fill="none" aria-hidden="true" {...props}>
      {kind === "balance" && (
        <>
          <path d="M20 133h179" stroke="currentColor" strokeWidth="1.5" />
          <ellipse cx="91" cy="123" rx="47" ry="10" fill="currentColor" />
          <ellipse
            cx="95"
            cy="100"
            rx="31"
            ry="13"
            fill="currentColor"
            transform="rotate(-13 95 100)"
          />
          <ellipse
            cx="88"
            cy="74"
            rx="22"
            ry="13"
            fill="currentColor"
            transform="rotate(18 88 74)"
          />
          <circle cx="97" cy="44" r="15" fill="currentColor" />
          <path
            d="M147 132V61a28 28 0 0 1 56 0v71m-45 0V61a17 17 0 0 1 34 0v71"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="m34 33 3 10 10 3-10 3-3 10-3-10-10-3 10-3z"
            fill="currentColor"
          />
          <circle cx="175" cy="13" r="4" fill="currentColor" />
        </>
      )}
      {kind === "steps" && (
        <>
          <path
            d="M24 130h173V84h-43V61h-44v23H67v23H24z"
            fill="currentColor"
          />
          <path
            d="M38 83a62 62 0 0 1 124-12M48 81a52 52 0 0 1 103-12"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <circle cx="183" cy="38" r="17" fill="currentColor" />
          <path
            d="m183 13 2 10m0 29-2 10m25-24h-8m-35 0h-8m10-17 6 7m20 22 6 7m0-36-6 7"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path
            d="M79 99h14m29-22h15m26 30h15"
            stroke="white"
            strokeWidth="1.5"
          />
        </>
      )}
      {kind === "orbit" && (
        <>
          <circle cx="108" cy="76" r="47" fill="currentColor" />
          <path d="M108 29a47 47 0 0 1 0 94z" fill="white" />
          <circle
            cx="108"
            cy="76"
            r="47"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <ellipse
            cx="108"
            cy="76"
            rx="95"
            ry="25"
            transform="rotate(-25 108 76)"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="187" cy="39" r="8" fill="currentColor" />
          <path d="m40 26 2 8 8 2-8 3-2 8-3-8-8-3 8-2z" fill="currentColor" />
          <path d="M85 137h47" stroke="currentColor" strokeWidth="1.2" />
        </>
      )}
      {kind === "door" && (
        <>
          <path d="M51 132V59a50 50 0 0 1 100 0v73z" fill="currentColor" />
          <path d="M66 132V61a35 35 0 0 1 70 0v71z" fill="white" />
          <path d="M81 132V62a20 20 0 0 1 40 0v70z" fill="currentColor" />
          <path
            d="M24 132h163m-72-65 54-24m-31 36 49-3m-48 14 47 12"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <circle cx="180" cy="23" r="11" fill="currentColor" />
          <circle cx="31" cy="82" r="4" fill="currentColor" />
        </>
      )}
    </svg>
  );
}

import React from "react";

interface IconProperties {

  className?: string;
  
  viewBox?: string;

  title?: string;

  style?: any;

  role?: string;

  size?: '16' | '24' | '32' | '40';
  height?: '16' | '24' | '32' | '40';
  width?: '16' | '24' | '32' | '40';
}

export const UnsecureIcon: React.FC<IconProperties> = ({
  size,
  height,
  width,
  ...props
}) => {
  return (
    <svg
      width={size || width || 24}
      height={size || height || 24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"
      {...props}
    >
  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
};
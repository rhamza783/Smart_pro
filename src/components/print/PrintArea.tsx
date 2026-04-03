import React from 'react';

const PrintArea: React.FC = () => {
  return (
    <>
      <div id="receipt-print-area" style={{ display: 'none' }}></div>
      <style>
        {`
          @media print {
            body > *:not(#receipt-print-area) {
              display: none !important;
            }
            #receipt-print-area {
              display: block !important;
              width: 80mm;
              margin: 0 auto;
              background: white;
              color: black;
            }
            @page {
              margin: 0;
              size: 80mm auto;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}
      </style>
    </>
  );
};

export default PrintArea;

import { useState } from "react";
import { Wheel } from "react-custom-roulette";

const RoulleteWheel = ({ data, prizeNumber }) => {
  const [mustSpin, setMustSpin] = useState(false);

  const handleSpinClick = () => {
    setMustSpin(true);
  };

  return (
    <>
      <Wheel
        mustStartSpinning={mustSpin}
        prizeNumber={prizeNumber}
        data={data}
        onStopSpinning={() => {
          setMustSpin(false);
        }}
      />
      <button onClick={handleSpinClick}>Spin</button>
    </>
  );
};

export default RoulleteWheel;

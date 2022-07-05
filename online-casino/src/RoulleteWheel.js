import { useState } from "react";
import { Wheel } from "react-custom-roulette";

const Roullete = ({ data }) => {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);

  const handleSpinClick = () => {
    const newPrizeNumber = Math.floor(Math.random() * data.length);
    setPrizeNumber(newPrizeNumber);
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

const RoulleteWheel = ({ numbers = 20 }) => {
  let data = [];
  for (let i = 1; i <= numbers; i++) {
    data.push({
      option: `${i}`,
    });
  }

  return <Roullete data={data} />;
};

export default RoulleteWheel;

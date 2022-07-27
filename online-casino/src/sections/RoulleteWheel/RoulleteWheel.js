import { Wheel } from "react-custom-roulette";

const RoulleteWheel = ({ data, prizeNumber, mustSpin }) => {
  console.log(prizeNumber);

  return (
    <>
      <Wheel
        mustStartSpinning={mustSpin}
        prizeNumber={prizeNumber}
        data={data}
        spinDuration={0.2}
      />
    </>
  );
};

export default RoulleteWheel;

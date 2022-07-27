import RoulleteWheel from "./RoulleteWheel";

const CreateRoulleteGame = ({ numbers = 20, prizeNumber = null, mustSpin }) => {
  let data = [];
  for (let i = 0; i < numbers; i++) {
    data.push({
      option: `${i}`,
    });
  }

  prizeNumber = prizeNumber
    ? prizeNumber
    : Math.floor(Math.random() * data.length);

  return (
    <RoulleteWheel data={data} prizeNumber={prizeNumber} mustSpin={mustSpin} />
  );
};

export default CreateRoulleteGame;

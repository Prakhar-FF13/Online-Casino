import RoulleteWheel from "./RoulleteWheel";

const CreateRoulleteGame = ({ numbers = 20, prizeNumber = null }) => {
  let data = [];
  for (let i = 1; i <= numbers; i++) {
    data.push({
      option: `${i}`,
    });
  }

  prizeNumber = prizeNumber
    ? prizeNumber
    : Math.floor(Math.random() * data.length);

  return <RoulleteWheel data={data} prizeNumber={prizeNumber} />;
};

export default CreateRoulleteGame;

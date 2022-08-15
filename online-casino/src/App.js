import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 1140px;
  margin: 0 auto;
`;

const Title = styled.h2`
  color: purple;
  margin: 24px auto;
`;

const NavContainer = styled.nav`
  display: flex;
  margin: 24px auto;
`;

const NavLink = styled(Link)`
  background-color: #53b3ff;
  padding: 8px;
  font-weight: 600;
  border: 0px;
  margin: 4px;
  border-radius: 3px;
  flex: 1;
  text-decoration: none;
  color: white;
  padding: 8px;
`;

function App() {
  return (
    <Container>
      <Title>Choose the game to play</Title>
      <NavContainer>
        <NavLink to="/wargame">WarGame</NavLink>
        <NavLink to="/roulette">RoulleteGame</NavLink>
      </NavContainer>
    </Container>
  );
}

export default App;

import React, { useState, useEffect } from "react";
import * as Y from "yjs";

interface DeckDiceRollingProps {
  yDoc: Y.Doc;
  localPlayerId: string;
}

interface LatestRoll {
  number: number;
  localPlayerId: string;
  selectedSides: number;
}

export default function DeckDiceRolling({
  yDoc,
  localPlayerId,
}: DeckDiceRollingProps) {
  const [selectedSides, setSelectedSides] = useState<number | null>(null);
  const [latestRoll, setLatestRoll] = useState<LatestRoll | null>(null);

  const generateRoll = (selectedSides: number | null) => {
    if (selectedSides === null) {
      return;
    } else {
      const minimum = 1;
      return (
        Math.floor(Math.random() * (selectedSides - minimum + 1)) + minimum
      );
    }
  };

  const formatRollResult = () => {
    if (!latestRoll) return "0";

    if (latestRoll.selectedSides === 2) {
      const result = latestRoll.number === 1 ? "Heads" : "Tails";
      return `${result}`;
    } else {
      return `${latestRoll.number}`;
    }
  };

  const isCoinFlip = () => {
    return latestRoll?.selectedSides === 2;
  };

  useEffect(() => {
    const yDiceRolls = yDoc.getMap("diceRolls");

    const observer = (event: Y.YMapEvent<any>) => {
      const latestRoll =
        (yDiceRolls.get("latestRoll") as LatestRoll | undefined) ?? null;
      setLatestRoll(latestRoll);
    };

    yDiceRolls.observe(observer);

    return () => yDiceRolls.unobserve(observer);
  }, [yDoc]);

  return (
    <div className="resource-pile">
      <output
        className={`dice-result-display ${
          isCoinFlip() ? "dice-result-coin" : "dice-result-number"
        }`}
      >
        {formatRollResult()}
      </output>
      <select
        name="diceSelector"
        id="diceSelector"
        className="dice-selector"
        value={selectedSides ?? ""}
        onChange={(e) => {
          const newValue =
            e.target.value === "" ? null : Number(e.target.value);
          setSelectedSides(newValue);
          if (newValue !== null) {
            setTimeout(() => {
              const newRoll = generateRoll(newValue);
              const yDiceRolls = yDoc.getMap("diceRolls");
              yDiceRolls.set("latestRoll", {
                number: newRoll,
                localPlayerId,
                selectedSides: newValue,
              });
              setSelectedSides(null);
            }, 0);
          }
        }}
      >
        <option value={""}>Select dice...</option>
        <option value={2}>Coin</option>
        <option value={4}>d4</option>
        <option value={6}>d6</option>
        <option value={8}>d8</option>
        <option value={12}>d12</option>
        <option value={20}>d20</option>
      </select>
    </div>
  );
}

describe('Move History Scrubber Navigation Controls', () => {
  // Test navigation state machine
  function createScrubber(historyLength: number) {
    let viewIndex = -1; // -1 represents live latest move

    const handleStepBack = () => {
      if (historyLength === 0) return;
      if (viewIndex === -1) {
        if (historyLength > 1) {
          viewIndex = historyLength - 2;
        } else {
          viewIndex = 0;
        }
      } else if (viewIndex > 0) {
        viewIndex -= 1;
      }
    };

    const handleStepForward = () => {
      if (viewIndex === -1) {
        // Must stay at live latest move - MUST NOT jump to 0!
        return;
      }
      if (viewIndex >= historyLength - 1) {
        viewIndex = -1;
      } else {
        viewIndex += 1;
      }
    };

    const handleFirstMove = () => {
      if (historyLength > 0) viewIndex = 0;
    };

    const handleLatestMove = () => {
      viewIndex = -1;
    };

    return {
      getViewIndex: () => viewIndex,
      handleStepBack,
      handleStepForward,
      handleFirstMove,
      handleLatestMove,
    };
  }

  test('Clicking forward while in live game NEVER resets to move 0', () => {
    const scrubber = createScrubber(6); // 6 moves played
    expect(scrubber.getViewIndex()).toBe(-1); // Live latest

    // User clicks forward step ▶
    scrubber.handleStepForward();
    expect(scrubber.getViewIndex()).toBe(-1); // Must still be at latest move (-1), NOT 0!

    scrubber.handleStepForward();
    expect(scrubber.getViewIndex()).toBe(-1); // Still latest move
  });

  test('Stepping backward and forward scrub sequentially without jumping', () => {
    const scrubber = createScrubber(4); // 4 moves: [0, 1, 2, 3]
    expect(scrubber.getViewIndex()).toBe(-1); // Live (move 3)

    // Step back once: should view move index 2
    scrubber.handleStepBack();
    expect(scrubber.getViewIndex()).toBe(2);

    // Step back again: should view move index 1
    scrubber.handleStepBack();
    expect(scrubber.getViewIndex()).toBe(1);

    // Step back to start: should view move index 0
    scrubber.handleStepBack();
    expect(scrubber.getViewIndex()).toBe(0);

    // Step back beyond start: stays at 0
    scrubber.handleStepBack();
    expect(scrubber.getViewIndex()).toBe(0);

    // Step forward: goes to 1
    scrubber.handleStepForward();
    expect(scrubber.getViewIndex()).toBe(1);

    // Step forward: goes to 2
    scrubber.handleStepForward();
    expect(scrubber.getViewIndex()).toBe(2);

    // Step forward: goes to 3
    scrubber.handleStepForward();
    expect(scrubber.getViewIndex()).toBe(3);

    // Step forward from last move: returns to live (-1)
    scrubber.handleStepForward();
    expect(scrubber.getViewIndex()).toBe(-1);

    // Forward again: stays at live (-1), DOES NOT jump to 0!
    scrubber.handleStepForward();
    expect(scrubber.getViewIndex()).toBe(-1);
  });

  test('Jump to first (⏮) and jump to latest (⏭) work cleanly', () => {
    const scrubber = createScrubber(10);
    expect(scrubber.getViewIndex()).toBe(-1);

    scrubber.handleFirstMove();
    expect(scrubber.getViewIndex()).toBe(0);

    scrubber.handleLatestMove();
    expect(scrubber.getViewIndex()).toBe(-1);
  });
});

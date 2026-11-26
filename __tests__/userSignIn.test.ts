describe('Username Sign-In & Duplicate Prevention', () => {
  interface UserProfile {
    id: string;
    username: string;
    display_name: string;
    is_online: boolean;
  }

  function resolveUserLogin(
    existingProfiles: UserProfile[],
    inputUsername: string,
    fallbackIdGenerator: () => string
  ): { profile: UserProfile; isExisting: boolean } {
    const clean = inputUsername.trim();
    // Case-insensitive lookup (sign in)
    const existing = existingProfiles.find(
      (p) => p.username.toLowerCase() === clean.toLowerCase()
    );

    if (existing) {
      return {
        profile: {
          ...existing,
          is_online: true,
        },
        isExisting: true,
      };
    }

    const newProfile: UserProfile = {
      id: fallbackIdGenerator(),
      username: clean,
      display_name: clean,
      is_online: true,
    };
    return {
      profile: newProfile,
      isExisting: false,
    };
  }

  const dbProfiles: UserProfile[] = [
    {
      id: 'barath-uuid-117',
      username: 'barathraj',
      display_name: 'barathraj',
      is_online: true,
    },
    {
      id: 'rajesh-uuid-278',
      username: 'rajeshkanna',
      display_name: 'rajeshkanna',
      is_online: true,
    },
  ];

  test('Signs in to existing user without creating a new profile or generating new ID', () => {
    const generatorMock = jest.fn(() => 'should-not-be-called');
    
    // Exact match
    const result1 = resolveUserLogin(dbProfiles, 'rajeshkanna', generatorMock);
    expect(result1.isExisting).toBe(true);
    expect(result1.profile.id).toBe('rajesh-uuid-278');
    expect(result1.profile.username).toBe('rajeshkanna');
    expect(generatorMock).not.toHaveBeenCalled();

    // Mixed case match ("RajeshKanna")
    const result2 = resolveUserLogin(dbProfiles, 'RajeshKanna', generatorMock);
    expect(result2.isExisting).toBe(true);
    expect(result2.profile.id).toBe('rajesh-uuid-278');
    expect(generatorMock).not.toHaveBeenCalled();
  });

  test('Signs in to barathraj without duplicating', () => {
    const generatorMock = jest.fn(() => 'should-not-be-called');
    const result = resolveUserLogin(dbProfiles, 'barathraj', generatorMock);
    expect(result.isExisting).toBe(true);
    expect(result.profile.id).toBe('barath-uuid-117');
    expect(generatorMock).not.toHaveBeenCalled();
  });

  test('Creates new profile only when username is genuinely new', () => {
    const generatorMock = jest.fn(() => 'new-uuid-999');
    const result = resolveUserLogin(dbProfiles, 'newplayer456', generatorMock);
    expect(result.isExisting).toBe(false);
    expect(result.profile.id).toBe('new-uuid-999');
    expect(result.profile.username).toBe('newplayer456');
    expect(generatorMock).toHaveBeenCalledTimes(1);
  });

  test('Ensures active player list filters out duplicates by username', () => {
    const rawListWithDuplicates: UserProfile[] = [
      { id: '1', username: 'rajeshkanna', display_name: 'rajeshkanna', is_online: true },
      { id: '2', username: 'rajeshkanna_86d5', display_name: 'rajeshkanna', is_online: true },
      { id: '3', username: 'barathraj', display_name: 'barathraj', is_online: true },
    ];

    // Filter out suffixed / dummy users and ensure uniqueness
    const seen = new Set<string>();
    const uniqueActive = rawListWithDuplicates.filter((p) => {
      const baseName = p.username.toLowerCase().split('_')[0];
      if (p.username.includes('_') && seen.has(baseName)) {
        return false;
      }
      seen.add(baseName);
      return true;
    });

    expect(uniqueActive).toHaveLength(2);
    expect(uniqueActive.map((u) => u.username)).toEqual(['rajeshkanna', 'barathraj']);
  });
});

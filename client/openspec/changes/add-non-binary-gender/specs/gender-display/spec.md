## ADDED Requirements

### Requirement: Gender picker supports non-binary option
The ProfileSetupPage and ProfilePage gender picker SHALL offer three options: `'male'`（男生）, `'female'`（女生）, `'non_binary'`（非二元）.

#### Scenario: New user selects non-binary during profile setup
- **WHEN** user is on ProfileSetupPage and taps the "非二元" button
- **THEN** gender state is set to `'non_binary'` and the button shows active state

#### Scenario: Existing user changes gender to non-binary in profile edit
- **WHEN** user is on ProfilePage and taps the "非二元" button
- **THEN** gender is saved as `'non_binary'` via updateProfile API call

### Requirement: Unified gender rendering via helper functions
The system SHALL provide a `genderUtils.ts` module with functions for label text, icon, tag style, and aura gradient. All gender display points SHALL use these functions instead of inline ternary expressions.

#### Scenario: Gender label rendering
- **WHEN** `genderLabel('male')` is called
- **THEN** returns `'男'`
- **WHEN** `genderLabel('female')` is called
- **THEN** returns `'女'`
- **WHEN** `genderLabel('non_binary')` is called
- **THEN** returns `'非二元'`
- **WHEN** `genderLabel(null)` is called
- **THEN** returns `'?'`

#### Scenario: Gender icon rendering
- **WHEN** `genderIcon('male')` is called
- **THEN** returns `'♂'`
- **WHEN** `genderIcon('female')` is called
- **THEN** returns `'♀'`
- **WHEN** `genderIcon('non_binary')` is called
- **THEN** returns `'◯'`

#### Scenario: Gender tag style
- **WHEN** `genderTagStyle('non_binary')` is called
- **THEN** returns `{ background: 'rgba(160, 180, 220, 0.15)', color: '#7a82a8' }`

### Requirement: Discovery page cards display non-binary gender correctly
All card types on the DiscoveryPage (discover, sent, received, relationships) SHALL display the correct label, icon, and colors for `'non_binary'` gender users.

#### Scenario: Non-binary user appears in discover tab
- **WHEN** a user with `gender: 'non_binary'` appears in the discover list
- **THEN** the soul card shows `◯` icon, "非二元" label, and neutral purple tag color

#### Scenario: Relationship card shows both clients' genders correctly
- **WHEN** a relationship involves a non-binary user
- **THEN** the relationship card displays "非二元" for that user (not defaulting to "女")

### Requirement: Wingman hall displays non-binary gender correctly
WingmanHallPage task cards SHALL display the correct gender label and tag style for `'non_binary'` clients.

#### Scenario: Non-binary client in wingman task card
- **WHEN** a wingman task's client has `gender: 'non_binary'`
- **THEN** the card shows "非二元" label with neutral purple tag color

### Requirement: AURA_OTHER gradient palette expanded
The `AURA_OTHER` gradient palette SHALL contain at least 3 gradient pairs, matching the count of `AURA_MALE` and `AURA_FEMALE`.

#### Scenario: Non-binary user gets varied aura gradients
- **WHEN** `getAuraGradient` is called for multiple non-binary users
- **THEN** at least 3 distinct gradient pairs are cycled through

# Autofill and input help

## Autocomplete tokens

Grammar (ASCII case-insensitive, space separated): `on` alone, `off` alone, or
`[section-<name>] [shipping|billing] ( <field> | [home|work|mobile|fax|pager] <contact-field> ) [webauthn]`

A field name is required. Contact types come only before a contact field. `webauthn` is valid on input and textarea, not select. On `type=hidden`, `on` and `off` are not allowed. Processing reads from the last token backwards, and any misplaced token falls back to default behaviour.

Field names by control group (54: 44 normal, 10 contact; * = contact field):

| Group | Count | Field names |
|---|---|---|
| Text | 36 | name, honorific-prefix, given-name, additional-name, family-name, honorific-suffix, nickname, organization-title, organization, address-line1, address-line2, address-line3, address-level4, address-level3, address-level2, address-level1, country, country-name, postal-code, cc-name, cc-given-name, cc-additional-name, cc-family-name, cc-number, cc-csc, cc-type, transaction-currency, language, sex, tel-country-code*, tel-national*, tel-area-code*, tel-local*, tel-local-prefix*, tel-local-suffix*, tel-extension* |
| Multiline | 1 | street-address |
| Username | 2 | username, email* |
| Password | 3 | new-password, current-password, one-time-code |
| URL | 3 | url, photo, impp* |
| Tel | 1 | tel* |
| Numeric | 6 | cc-exp-month, cc-exp-year, transaction-amount, bday-day, bday-month, bday-year |
| Month | 1 | cc-exp |
| Date | 1 | bday |

Other tokens: on (Automatic), off (Off), webauthn (Credential). Modifiers: section-*, shipping, billing, home, work, mobile, fax, pager.

Elements per group: Text: input hidden/text/search, textarea, select. Multiline: input hidden, textarea, select (not input text/search). Others: Text's elements plus Password->password, URL->url, Username->email, Tel->tel, Numeric->number, Month->month, Date->date.

Derived allow-list:

| Element | Allowed field names |
|---|---|
| input text, search | all except street-address |
| textarea, select, hidden | all 54 |
| type=email | username, email |
| type=password | new-password, current-password, one-time-code |
| type=tel | tel only (tel-national and parts are Text group) |
| type=url | url, photo, impp |
| type=number | the 6 Numeric names |
| type=month | cc-exp |
| type=date | bday |
| week, time, datetime-local, range, color | on and off only |
| checkbox, radio, file, submit, image, reset, button | attribute does not apply |

Hierarchy (prefer broad; narrow fields carry Western bias): name > honorific-prefix, given-name, additional-name, family-name, honorific-suffix; street-address > address-line1..3; cc-name > cc-given/additional/family-name; cc-exp > cc-exp-month, cc-exp-year; bday > bday-day/month/year; tel > tel-country-code, tel-national; tel-national > tel-area-code, tel-local; tel-local > tel-local-prefix, tel-local-suffix.

Canonical formats: country ISO 3166-1 alpha-2; transaction-currency ISO 4217; language BCP 47; cc-exp YYYY-MM; bday date string; cc-exp-month, bday-month 1-12; bday-day 1-31; tel "+" then digits and spaces; cc-number, cc-csc ASCII digits. address-level meaning varies by country (US level2 town before level1 state; Japan 1, 2, 3); reorder fields to match chosen country.

Rules:

- Every personal-data field carries a token.
- `off` only for fields such as search where saved values mislead.
- `section-<name>` names a group such as a second address.
- `shipping` and `billing` mark address groups.

Token table from the WHATWG HTML Living Standard, section 4.10.19.7, licensed under CC BY 4.0, read 2026-10-27.

## React Native

`autoComplete` is the cross-platform prop; `textContentType` is iOS only and wins when both are set. Set `textContentType` where the iOS value differs from the autoComplete name. "none" means React Native documents no value.

| Field | `autoComplete` | `textContentType` |
|---|---|---|
| Name | `name` | `name` |
| Given name | `given-name` | `givenName` |
| Family name | `family-name` | `familyName` |
| Nickname | `nickname` (iOS only) | `nickname` |
| Email | `email` | `emailAddress` |
| Username | `username` | `username` |
| New password | `new-password` | `newPassword` |
| Current password | `current-password` | `password` |
| One-time code | `one-time-code` (Android only: `sms-otp`) | `oneTimeCode` |
| Phone | `tel` | `telephoneNumber` |
| Street address | `street-address` | `fullStreetAddress` |
| Address line 1 | `address-line1` | `streetAddressLine1` |
| Address line 2 | `address-line2` | `streetAddressLine2` |
| City | `postal-address-locality` (Android only) | `addressCity` |
| State or region | `postal-address-region` (Android only) | `addressState` |
| Postal code | `postal-code` | `postalCode` |
| Country | `country` | `countryName` |
| Birth date | `birthdate-full` (iOS 17+) | `birthdate` (iOS 17+) |
| Credit card number | `cc-number` | `creditCardNumber` |

Note: values read from https://reactnative.dev/docs/textinput on 2026-10-27 (props `autoComplete` and `textContentType`). `off` disables autofill on Android.

## Keyboards

| Kind | `type` | `inputmode` |
|---|---|---|
| Email | `email` | `email` |
| Phone | `tel` | `tel` |
| URL | `url` | `url` |
| Numeric codes (postal, card, account) | `text` | `numeric` |
| Decimals | `text` | `decimal` |
| Search | `search` | `search` |
| One-time code | `text` | `numeric` |

`enterkeyhint` is `next` on fields within a step and `done` or `send` on the last field.

Inputs use at least a 16px font so iOS does not zoom on focus, and the viewport never sets `maximum-scale` or `user-scalable=no`.

## Input help: free and keyless

- `Intl.DisplayNames`: country, language, and currency names.
- `Intl.supportedValuesOf("currency")` and `Intl.supportedValuesOf("timeZone")`: the option lists for those fields.
- `navigator.languages` and `Intl.DateTimeFormat().resolvedOptions().timeZone`: defaults for language and time zone, read in an effect to avoid hydration mismatches.
- The app's own data: distinct values as suggestions, relations as Combobox options.
- libphonenumber-js: phone parsing and formatting.
- chrono-node: typed natural-language dates.
- A local map of common email domain typos: a "did you mean" hint.
- Prefill from the signed-in user's record.
- Company derived from the email domain.

## Input help: ask first

Address lookup services (Google Places, Mapbox, Geoapify, Loqate), enrichment services (HubSpot Breeze, Clay, Apollo), breached-password checks (Have I Been Pwned's range API sends a hash prefix), and geo-IP lookups all ask first. For each one you propose, name the key, the cost, and what user data leaves the app, and add it only after a yes. A lookup always keeps the manual route.

Field guidance adapted from web.dev sign-in, sign-up, and payment and address form best practices by Sam Dutton, CC BY 4.0.

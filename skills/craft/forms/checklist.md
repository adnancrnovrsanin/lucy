# Checklist

Answer each check yes or no. `[static]` means reading the code settles it; `[browser]` means it needs the running app.

## Model coverage

- [ ] Every model field has a row in the field table. [static]
- [ ] Every visible field is rendered. [static]
- [ ] Hidden fields are server-set, or deferred with the user's agreement. [static]

## Controls

- [ ] Every control comes from the library inventory. [static]
- [ ] Option counts match the thresholds in the field map. [static]
- [ ] Dates use the picker or the memorable-date inputs. [static]
- [ ] No `type="number"` outside quantities. [static]

## Input help

- [ ] Personal-data fields carry autocomplete tokens. [static]
- [ ] Keyboards match the kind of value. [static]
- [ ] Suggestions or lookups are in place where the autofill reference says. [static]

## Structure

- [ ] The split rule holds for the field count. [static]
- [ ] Each step has its own validation. [static]
- [ ] The review step exists where required. [static]

## Feedback

- [ ] The first check fires at the right moment for the form size. [static]
- [ ] Errors appear inline, and in the summary where required. [static]
- [ ] Focus lands on the summary or the first invalid field. [browser]
- [ ] Server errors map onto their fields. [browser]
- [ ] Pending, success, and unsaved-changes behave as in feedback.md. [browser]

## Accessibility

- [ ] Every control has a visible label. [static]
- [ ] Descriptions and errors are tied with aria-describedby. [static]
- [ ] The whole form works by keyboard. [browser]
- [ ] Status messages are announced. [browser]

## Real data

- [ ] The longest value each column allows fits and submits. [browser]
- [ ] Names with accents, apostrophes, and non-Latin scripts work. [browser]
- [ ] Pasted values with spaces are accepted. [browser]
- [ ] A slow network shows the pending states. [browser]

Every check you could not run is reported as "Not verified", never assumed.

((
(_ -replace '\.md', '' -replace '-', ' ' | ForEach-Object { (Get-Culture).TextInfo.ToTitleCase(
_) })

[TODO: Component documentation à compléter]
Props
PropTypeDescriptionprop1stringDescription
Usage
typescript<ComponentName prop1="value" />
Exemples
→ Retour API Reference

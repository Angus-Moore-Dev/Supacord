export default function generateHexColour(input: string): string 
{
    // Create a hash of the input string
    let hash = 0;
    for (let i = 0; i < input.length; i++) 
    {
        hash = input.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Convert hash to a hue value (0-360)
    const hue = hash % 360;

    // Use HSL to ensure bright and saturated colors
    const saturation = 100; // Full saturation
    const lightness = 65 + (hash % 20); // Range from 65% to 85% lightness

    // Convert HSL to RGB
    const c = (1 - Math.abs(2 * lightness / 100 - 1)) * saturation / 100;
    const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
    const m = lightness / 100 - c / 2;

    let r, g, b;
    if (hue < 60) 
    {
        [r, g, b] = [c, x, 0];
    }
    else if (hue < 120) 
    {
        [r, g, b] = [x, c, 0];
    }
    else if (hue < 180) 
    {
        [r, g, b] = [0, c, x];
    }
    else if (hue < 240) 
    {
        [r, g, b] = [0, x, c];
    }
    else if (hue < 300) 
    {
        [r, g, b] = [x, 0, c];
    }
    else 
    {
        [r, g, b] = [c, 0, x];
    }

    // Convert RGB to hex
    const toHex = (value: number) => 
    {
        const hex = Math.round((value + m) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
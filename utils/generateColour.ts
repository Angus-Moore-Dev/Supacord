export default function generateVibrantHexColour(input: string): string 
{
    // Special case for 'public.notes'
    if (input === 'public.notes') 
    {
        return '#FF0000'; // Bright red
    }

    // Create a hash of the input string
    let hash = 0;
    for (let i = 0; i < input.length; i++) 
    {
        hash = input.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Convert hash to a hue value (0-360)
    const hue = Math.abs(hash % 360);

    // Use HSL to ensure bright and vibrant colors
    const saturation = 70 + (Math.abs(hash) % 30); // Range from 70% to 100% saturation
    const lightness = 60 + (Math.abs(hash) % 30); // Range from 60% to 90% lightness

    // Convert HSL to RGB
    const h = hue / 60;
    const c = (1 - Math.abs(2 * lightness / 100 - 1)) * saturation / 100;
    const x = c * (1 - Math.abs(h % 2 - 1));
    const m = lightness / 100 - c / 2;

    let r, g, b;
    if (h < 1) 
    {
        [r, g, b] = [c, x, 0];
    }
    else if (h < 2) 
    {
        [r, g, b] = [x, c, 0];
    }
    else if (h < 3) 
    {
        [r, g, b] = [0, c, x];
    }
    else if (h < 4) 
    {
        [r, g, b] = [0, x, c];
    }
    else if (h < 5) 
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

    const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

    // Check if the color is too dark and adjust if necessary
    const rgbColor = hexToRgb(hexColor);
    if (rgbColor) 
    {
        const brightness = (rgbColor.r * 299 + rgbColor.g * 587 + rgbColor.b * 114) / 1000;
        if (brightness < 128) 
        {
            // If too dark, increase lightness
            return generateVibrantHexColour(input + '_bright');
        }
    }

    return hexColor;
}

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number, g: number, b: number } | null 
{
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
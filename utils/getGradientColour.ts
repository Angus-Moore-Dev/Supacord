

export default function getGradientColour(value: number, min: number, max: number): string 
{
    // Normalize the value to 0-1 range
    const normalized = (value - min) / (max - min);

    // Calculate RGB values for a smooth red -> yellow -> green -> blue gradient
    let r: number, g: number, b: number;

    if (normalized < 0.33) 
    {
    // Red to Yellow (increase green)
        r = 255;
        g = Math.round((normalized * 3) * 255);
        b = 0;
    }
    else if (normalized < 0.67) 
    {
    // Yellow to Green (decrease red)
        r = Math.round((1 - ((normalized - 0.33) * 3)) * 255);
        g = 255;
        b = 0;
    }
    else 
    {
    // Green to Blue (increase blue, decrease green)
        r = 0;
        g = Math.round((1 - ((normalized - 0.67) * 3)) * 255);
        b = Math.round(((normalized - 0.67) * 3) * 255);
    }

    return `rgb(${r}, ${g}, ${b})`;
}
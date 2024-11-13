import React from 'react';
import { Table } from '@mantine/core';

type TableData = Record<string, string | number | null>[];

export function TableVisual(props: { data: TableData }): JSX.Element 
{
    // Extract column headers from the first data item
    const columns: string[] = Object.keys(props.data[0] || {});

    // Format header text from snake_case to Title Case
    const formatHeader = (header: string): string => 
    {
        return header
            .split('_')
            .map((word: string): string => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Format cell value with null handling
    const formatValue = (value: string | number | null): string => 
    {
        if (value === null) return '-';
        return String(value);
    };

    return (
        <Table striped highlightOnHover withColumnBorders>
            <Table.Thead>
                <Table.Tr>
                    {columns.map((column: string): JSX.Element => (
                        <Table.Th key={column}>
                            {formatHeader(column)}
                        </Table.Th>
                    ))}
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {props.data.map((row: Record<string, string | number | null>, index: number): JSX.Element => (
                    <Table.Tr key={index}>
                        {columns.map((column: string): JSX.Element => (
                            <Table.Td key={`${index}-${column}`}>
                                {formatValue(row[column])}
                            </Table.Td>
                        ))}
                    </Table.Tr>
                ))}
            </Table.Tbody>
        </Table>
    );
}
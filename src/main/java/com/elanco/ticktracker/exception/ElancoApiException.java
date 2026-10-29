package com.elanco.ticktracker.exception;

import com.elanco.ticktracker.client.ElancoApiClient;

public class ElancoApiException extends RuntimeException
{
    public ElancoApiException(String meesage, Throwable cause)
    {
        super(meesage, cause);
    }
}

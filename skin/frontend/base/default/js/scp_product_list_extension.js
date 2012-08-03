/*
    Some of these override earlier varien/product.js methods, therefore
    varien/product.js must have been included prior to this file.
*/

Product.Config.prototype.initialize = function(config){
        this.config     = config;
        this.taxConfig  = this.config.taxConfig;
        var settingsClassToSelect = '.super-attribute-select_'+this.config.productId;
        this.settings   = $$(settingsClassToSelect);
        this.state      = new Hash();
        this.priceTemplate = new Template(this.config.template);
        this.prices     = config.prices;
 
        this.settings.each(function(element){
            Event.observe(element, 'change', this.configure.bind(this))
        }.bind(this));
        
        // fill state
        this.settings.each(function(element){
            var attributeId = element.id.replace(/[a-z]*/, '');  
            attributeId = attributeId.replace(/_.*/, '');
            if(attributeId && this.config.attributes[attributeId]) {
                element.config = this.config.attributes[attributeId];
                element.attributeId = attributeId;
                this.state[attributeId] = false;
            }
        }.bind(this))
 
        // Init settings dropdown
        var childSettings = [];
        for(var i=this.settings.length-1;i>=0;i--){
            var prevSetting = this.settings[i-1] ? this.settings[i-1] : false;
            var nextSetting = this.settings[i+1] ? this.settings[i+1] : false;
            if(i==0){
                this.fillSelect(this.settings[i])
            }
            else {
                this.settings[i].disabled=true;
            }
            $(this.settings[i]).childSettings = childSettings.clone();
            $(this.settings[i]).prevSetting   = prevSetting;
            $(this.settings[i]).nextSetting   = nextSetting;
            childSettings.push(this.settings[i]);
        }
 
        // Set default values - from config and overwrite them by url values
        if (config.defaultValues) {
            this.values = config.defaultValues;
        }
 
        var separatorIndex = window.location.href.indexOf('#');
        if (separatorIndex != -1) {
            var paramsStr = window.location.href.substr(separatorIndex+1);
            var urlValues = paramsStr.toQueryParams();
            if (!this.values) {
                this.values = {};
            }
            for (var i in urlValues) {
                this.values[i] = urlValues[i];
            }
        }
 
        this.configureForValues();
        document.observe("dom:loaded", this.configureForValues.bind(this));
};

/*
    Some of these override earlier varien/product.js methods, therefore
    varien/product.js must have been included prior to this file.
*/

Product.Config.prototype.fillSelect = function(element){
    var attributeId = element.id.replace(/[a-z]*/, '');
    attributeId = attributeId.replace(/_.*/, '');  
    var options = this.getAttributeOptions(attributeId);
    this.clearSelect(element);
    element.options[0] = new Option(this.config.chooseText, '');

    var prevConfig = false;
    if(element.prevSetting){
        prevConfig = element.prevSetting.options[element.prevSetting.selectedIndex];
    }

    if(options) {
        var index = 1;
        for(var i=0;i<options.length;i++){
            var allowedProducts = [];
            if(prevConfig) {
                for(var j=0;j<options[i].products.length;j++){
                    if(prevConfig.config.allowedProducts
                        && prevConfig.config.allowedProducts.indexOf(options[i].products[j])>-1){
                        allowedProducts.push(options[i].products[j]);
                    }
                }
            } else {
                allowedProducts = options[i].products.clone();
            }

            if(allowedProducts.size()>0){
                options[i].allowedProducts = allowedProducts;
                element.options[index] = new Option(this.getOptionLabel(options[i], options[i].price), options[i].id);
                element.options[index].config = options[i];
                index++;
            }
        }
    }
};


Product.Config.prototype.updateFormProductId = function(productId){
    if (!productId) {
        return false;
    }
    var currentAction = $('product_addtocart_form_' + this.config.productId).action;
    newcurrentAction = currentAction.sub(/product\/\d+\//, 'product/' + productId + '/');
    $('product_addtocart_form_' + this.config.productId).action = newcurrentAction;
    $('product_addtocart_form_' + this.config.productId).product.value = productId;
};


Product.Config.prototype.addParentProductIdToCartForm = function(parentProductId) {
    if (typeof $('product_addtocart_form_' + this.config.productId).cpid != 'undefined') {
        return; //don't create it if we have one..
    }
    var el = document.createElement("input");
    el.type = "hidden";
    el.name = "cpid";
    el.value = parentProductId.toString();
    $('product_addtocart_form_' + this.config.productId).appendChild(el);
};



Product.OptionsPrice.prototype.updateSpecialPriceDisplay = function(price, finalPrice) {

    var prodForm = $('product_addtocart_form_' + this.productId);

    var specialPriceBox = prodForm.select('p.special-price');
    var oldPricePriceBox = prodForm.select('p.old-price, p.was-old-price');
    var magentopriceLabel = prodForm.select('span.price-label');

    if (price == finalPrice) {
        specialPriceBox.each(function(x) {x.hide();});
        magentopriceLabel.each(function(x) {x.hide();});
        oldPricePriceBox.each(function(x) {
            x.removeClassName('old-price');
            x.addClassName('was-old-price');
        });
    }else{
        specialPriceBox.each(function(x) {x.show();});
        magentopriceLabel.each(function(x) {x.show();});
        oldPricePriceBox.each(function(x) {
            x.removeClassName('was-old-price');
            x.addClassName('old-price');
        });
    }
};

//This triggers reload of price and other elements that can change
//once all options are selected
Product.Config.prototype.reloadPrice = function() {
    var childProductId = this.getMatchingSimpleProduct();
    var childProducts = this.config.childProducts;
    var usingZoomer = false;
    if(this.config.imageZoomer){
        usingZoomer = true;
    }

    if(childProductId){
        var price = childProducts[childProductId]["price"];
        var finalPrice = childProducts[childProductId]["finalPrice"];
        window['optionsPrice_' + this.config.productId].productPrice = finalPrice;
        window['optionsPrice_' + this.config.productId].productOldPrice = price;
        window['optionsPrice_' + this.config.productId].reload();
        window['optionsPrice_' + this.config.productId].reloadPriceLabels(true);
        window['optionsPrice_' + this.config.productId].updateSpecialPriceDisplay(price, finalPrice);
        this.updateProductShortDescription(childProductId);
        this.updateProductDescription(childProductId);
        this.updateProductName(childProductId);
        this.updateProductAttributes(childProductId);
        this.updateFormProductId(childProductId);
        this.addParentProductIdToCartForm(this.config.productId);
        this.showCustomOptionsBlock(childProductId, this.config.productId);
        if (usingZoomer) {
            this.showFullImageDiv(childProductId, this.config.productId);
        }else{
            this.updateProductImage(childProductId);
        }

    } else {
        var cheapestPid = this.getProductIdOfCheapestProductInScope("finalPrice");
        //var mostExpensivePid = this.getProductIdOfMostExpensiveProductInScope("finalPrice");
        var price = childProducts[cheapestPid]["price"];
        var finalPrice = childProducts[cheapestPid]["finalPrice"];
        window['optionsPrice_' + this.config.productId].productPrice = finalPrice;
        window['optionsPrice_' + this.config.productId].productOldPrice = price;
        window['optionsPrice_' + this.config.productId].reload();
        window['optionsPrice_' + this.config.productId].reloadPriceLabels(false);
        window['optionsPrice_' + this.config.productId].updateSpecialPriceDisplay(price, finalPrice);
        this.updateProductShortDescription(false);
        this.updateProductDescription(false);
        this.updateProductName(false);
        this.updateProductAttributes(false);
        this.showCustomOptionsBlock(false, false);
        if (usingZoomer) {
            this.showFullImageDiv(false, false);
        }else{
            this.updateProductImage(false);
        }
    }
};



Product.Config.prototype.updateProductImage = function(productId) {
    var imageUrl = this.config.imageUrl;
    if(productId && this.config.childProducts[productId].imageUrl) {
        imageUrl = this.config.childProducts[productId].imageUrl;
    }

    if (!imageUrl) {
        return;
    }

    if($('image_' + this.config.productId)) {
        $('image_' + this.config.productId).src = imageUrl;
    } else {
        $$('#product_addtocart_form_' + this.config.productId + ' p.product-image img').each(function(el) {
            var dims = el.getDimensions();
            el.src = imageUrl;
            el.width = dims.width;
            el.height = dims.height;
        });
    }
};

Product.Config.prototype.updateProductName = function(productId) {
    var productName = this.config.productName;
    if (productId && this.config.childProducts[productId].productName) {
        productName = this.config.childProducts[productId].productName;
    }
    $$('#product_addtocart_form_' + this.config.productId + ' div.product-name h1').each(function(el) {
        el.innerHTML = productName;
    });
};

Product.Config.prototype.updateProductShortDescription = function(productId) {
    var shortDescription = this.config.shortDescription;
    if (productId && this.config.childProducts[productId].shortDescription) {
        shortDescription = this.config.childProducts[productId].shortDescription;
    }
    $$('#product_addtocart_form_' + this.config.productId + ' div.short-description div.std').each(function(el) {
        el.innerHTML = shortDescription;
    });
};

Product.Config.prototype.updateProductDescription = function(productId) {
    var description = this.config.description;
    if (productId && this.config.childProducts[productId].description) {
        description = this.config.childProducts[productId].description;
    }
    $$('#product_addtocart_form_' + this.config.productId + ' div.box-description div.std').each(function(el) {
        el.innerHTML = description;
    });
};

Product.Config.prototype.updateProductAttributes = function(productId) {
    var productAttributes = this.config.productAttributes;
    if (productId && this.config.childProducts[productId].productAttributes) {
        productAttributes = this.config.childProducts[productId].productAttributes;
    }
    //If config product doesn't already have an additional information section,
    //it won't be shown for associated product either. It's too hard to work out
    //where to place it given that different themes use very different html here
    $$('#product_addtocart_form_' + this.config.productId + ' div.product-collateral div.box-additional').each(function(el) {
        el.innerHTML = productAttributes;
        decorateTable('product-attribute-specs-table');
    });
};

Product.Config.prototype.showCustomOptionsBlock = function(productId, parentId) {
    var coUrl = this.config.ajaxBaseUrl + "co/?id=" + productId + '&pid=' + parentId;
    var prodForm = $('product_addtocart_form_' + this.config.productId);

   if ($('SCPcustomOptionsDiv')==null) {
      return;
   }

    Effect.Fade('SCPcustomOptionsDiv', { duration: 0.5, from: 1, to: 0.5 });
    if(productId) {
        //Uncomment the line below if you want an ajax loader to appear while any custom
        //options are being loaded.
        //$$('span.scp-please-wait').each(function(el) {el.show()});

        //prodForm.getElements().each(function(el) {el.disable()});
        new Ajax.Updater('SCPcustomOptionsDiv', coUrl, {
          method: 'get',
          evalScripts: true,
          onComplete: function() {
              $$('span.scp-please-wait').each(function(el) {el.hide()});
              Effect.Fade('SCPcustomOptionsDiv', { duration: 0.5, from: 0.5, to: 1 });
              //prodForm.getElements().each(function(el) {el.enable()});
          }
        });
    } else {
        $('SCPcustomOptionsDiv').innerHTML = '';
        try{window.opConfig = new Product.Options([]);} catch(e){}
    }
};


Product.Config.prototype.showFullImageDiv = function(productId, parentId) {
    var imgUrl = this.config.ajaxBaseUrl + "image/?id=" + productId + '&pid=' + parentId;
    var prodForm = $('product_addtocart_form_' + this.config.productId);
    var destElement = false;
    var defaultZoomer = this.config.imageZoomer;

    prodForm.select('div.product-img-box').each(function(el) {
        destElement = el;
    });

    //TODO: This is needed to reinitialise Product.Zoom correctly,
    //but there's still a race condition (in the onComplete below) which can break it
    try {product_zoom.draggable.destroy();} catch(x) {}

    if(productId) {
        new Ajax.Updater(destElement, imgUrl, {
            method: 'get',
            evalScripts: false,
            onComplete: function() {
                //Product.Zoom needs the *image* (not just the html source from the ajax)
                //to have loaded before it works, hence image object and onload handler
                if ($('image')){
                    var imgObj = new Image();
                    imgObj.onload = function() {product_zoom = new Product.Zoom('image', 'track', 'handle', 'zoom_in', 'zoom_out', 'track_hint'); };
                    imgObj.src = $('image').src;
                } else {
                    destElement.innerHTML = defaultZoomer;
                    product_zoom = new Product.Zoom('image', 'track', 'handle', 'zoom_in', 'zoom_out', 'track_hint')
                }
          }
        });
    } else {
        destElement.innerHTML = defaultZoomer;
        product_zoom = new Product.Zoom('image', 'track', 'handle', 'zoom_in', 'zoom_out', 'track_hint');
    }
};


Product.OptionsPrice.prototype.reloadPriceLabels = function(productPriceIsKnown) {
    var priceFromLabel = '';
    var prodForm = $('product_addtocart_form_' + this.productId);

    if (!productPriceIsKnown && typeof window['spConfig' + this.productId] != "undefined") {
        priceFromLabel = window['spConfig' + this.productId].config.priceFromLabel;
    }

    var priceSpanId = 'configurable-price-from-' + this.productId;
    var duplicatePriceSpanId = priceSpanId + this.duplicateIdSuffix;

    if($(priceSpanId) && $(priceSpanId).select('span.configurable-price-from-label'))
        $(priceSpanId).select('span.configurable-price-from-label').each(function(label) {
        label.innerHTML = priceFromLabel;
    });

    if ($(duplicatePriceSpanId) && $(duplicatePriceSpanId).select('span.configurable-price-from-label')) {
        $(duplicatePriceSpanId).select('span.configurable-price-from-label').each(function(label) {
            label.innerHTML = priceFromLabel;
        });
    }
};


//SCP: Forces price labels to be updated on load
//so that first select shows ranges from the start
document.observe("dom:loaded", function() {
    //Really only needs to be the first element that has configureElement set on it,
    //rather than all.
    $('product_addtocart_form_' + this.config.productId).getElements().each(function(el) {
        if(el.type == 'select-one') {
            if(el.options && (el.options.length > 1)) {
                el.options[0].selected = true;
                window['spConfig' + this.config.productId].reloadOptionLabels(el);
            }
        }
    });
});
